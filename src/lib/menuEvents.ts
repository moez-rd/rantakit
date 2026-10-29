import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

/** Menu item ids forwarded by `src-tauri/src/menu.rs`. */
export type MenuItemId =
  | "compress_image"
  | "compress_pdf"
  | "go_home"
  | "go_recents"
  | "open_settings";

/** Call `handler` whenever a native menu item is chosen. No-op outside Tauri. */
export function useMenuEvents(handler: (id: MenuItemId) => void) {
  // Keep the latest handler without re-subscribing on every render.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isTauri()) return;

    const unlisten = getCurrentWebviewWindow().listen<MenuItemId>("menu", (event) =>
      handlerRef.current(event.payload),
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
