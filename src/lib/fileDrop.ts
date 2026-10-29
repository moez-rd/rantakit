import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export interface DragState {
  /** Dragged files that `accept` lets through. */
  accepted: number;
  total: number;
}

/**
 * Files dragged onto the window from the OS. Tauri delivers real paths here,
 * which the browser's own drag-and-drop doesn't. No-op outside Tauri.
 */
export function useFileDrop(accept: (path: string) => boolean, onDrop: (paths: string[]) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // Keep the latest callbacks without re-subscribing on every render.
  const latest = useRef({ accept, onDrop });
  latest.current = { accept, onDrop };

  useEffect(() => {
    if (!isTauri()) return;

    const unlisten = getCurrentWebview().onDragDropEvent(({ payload }) => {
      const { accept, onDrop } = latest.current;
      switch (payload.type) {
        case "enter":
          setDrag({ accepted: payload.paths.filter(accept).length, total: payload.paths.length });
          break;
        case "drop": {
          setDrag(null);
          const paths = payload.paths.filter(accept);
          if (paths.length > 0) onDrop(paths);
          break;
        }
        case "leave":
          setDrag(null);
          break;
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return drag;
}
