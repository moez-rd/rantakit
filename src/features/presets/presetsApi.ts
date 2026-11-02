import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

/** Mirrors `Preset` in crates/rantakit-tasks/src/presets.rs. */
export interface Preset {
  id: string;
  tool: string;
  name: string;
  /** The Tool's settings as its page keeps them. */
  options: object;
}

/** One Tool's Presets, oldest first, with ways to change them. */
export function usePresets(tool: string) {
  const [presets, setPresets] = useState<Preset[]>([]);

  const reload = useCallback(
    () =>
      invoke<Preset[]>("list_presets", { tool })
        .then(setPresets)
        .catch(() => {}),
    [tool],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (name: string, options: object) => {
      const preset = await invoke<Preset>("save_preset", { tool, name, options });
      await reload();
      return preset;
    },
    [tool, reload],
  );
  const rename = useCallback(
    (id: string, name: string) => invoke("rename_preset", { id, name }).then(reload),
    [reload],
  );
  const remove = useCallback((id: string) => invoke("remove_preset", { id }).then(reload), [reload]);

  return { presets, save, rename, remove };
}
