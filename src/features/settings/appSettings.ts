import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

/** Mirrors `Settings` in crates/rantakit-tasks/src/settings.rs: what the backend acts on. */
export interface AppSettings {
  /** "Simpan riwayat". */
  keepHistory: boolean;
}

const CHANGE_EVENT = "rantakit:app-settings";
let cached: AppSettings | null = null;

function publish(settings: AppSettings) {
  cached = settings;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return settings;
}

/** The backend's settings, null until read; every user of the hook sees changes at once. */
export function useAppSettings() {
  const [settings, setSettings] = useState(cached);
  useEffect(() => {
    const sync = () => setSettings(cached);
    window.addEventListener(CHANGE_EVENT, sync);
    invoke<AppSettings>("get_settings")
      .then(publish)
      .catch(() => {});
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);
  return settings;
}

/** Turning History off also clears it; Result files stay. */
export function setKeepHistory(keep: boolean) {
  return invoke<AppSettings>("set_keep_history", { keep }).then(publish);
}
