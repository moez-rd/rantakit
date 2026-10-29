import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";

/**
 * Files dragged onto the window from the OS. Tauri delivers real paths here,
 * which the browser's own drag-and-drop doesn't. No-op outside Tauri.
 *
 * Returns the paths being dragged, or null when nothing is.
 */
export function useFileDrop(onDrop: (paths: string[]) => void) {
  const [dragging, setDragging] = useState<string[] | null>(null);
  // Keep the latest callback without re-subscribing on every render.
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    if (!isTauri()) return;

    const unlisten = getCurrentWebview().onDragDropEvent(({ payload }) => {
      switch (payload.type) {
        case "enter":
          setDragging(payload.paths);
          break;
        case "drop":
          setDragging(null);
          onDropRef.current(payload.paths);
          break;
        case "leave":
          setDragging(null);
          break;
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return dragging;
}
