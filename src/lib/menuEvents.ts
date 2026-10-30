import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { AppCommand } from "./appCommands";

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
