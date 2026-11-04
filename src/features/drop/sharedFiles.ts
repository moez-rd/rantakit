import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { withNames } from "@/features/compress/imageApi";
import { isAndroidApp } from "@/lib/platform";

/**
 * Photos and PDFs shared to Rantakit from another app on Android: those that
 * opened the app, then each share while it runs. Android only.
 */
export function useSharedFiles(onShare: (paths: string[]) => void) {
  // Keep the latest callback without re-subscribing on every render.
  const onShareRef = useRef(onShare);
  onShareRef.current = onShare;

  useEffect(() => {
    if (!isAndroidApp) return;

    const take = async () => {
      const paths = await withNames(await invoke<string[]>("take_shared_files").catch(() => []));
      if (paths.length > 0) onShareRef.current(paths);
    };
    const unlisten = getCurrentWebviewWindow().listen("shared-files", () => void take());
    void take();
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
