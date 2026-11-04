import { useEffect, useRef } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useT } from "@/i18n";
import type { AppCommand } from "./appCommands";
import { isAndroidApp, isMacApp } from "./platform";

/** Call `handler` whenever a native menu item is chosen (macOS only). No-op outside Tauri. */
export function useMenuEvents(handler: (command: AppCommand) => void) {
  // Keep the latest handler without re-subscribing on every render.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isTauri()) return;

    const unlisten = getCurrentWebviewWindow().listen<AppCommand>("menu", (event) =>
      handlerRef.current(event.payload),
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}

/** Keep what Rust shows itself in the UI language: the native menu bar on macOS, the Task notifications on Android. */
export function useNativeLanguage() {
  const { language } = useT();
  useEffect(() => {
    if (isMacApp || isAndroidApp) invoke("set_language", { language }).catch(() => {});
  }, [language]);
}
