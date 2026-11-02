import { useEffect, useRef } from "react";

/**
 * Everything the menus can do. The macOS menu bar sends the first five as `menu`
 * events (see src-tauri/src/menu.rs); the in-app menu sends all of them.
 */
export type AppCommand =
  | "compress_image"
  | "compress_pdf"
  | "go_home"
  | "go_history"
  | "open_settings"
  | "open_source"
  | "open_license"
  | "open_about";

interface Shortcut {
  key: string;
  shift?: boolean;
  /** Shown next to the menu item. */
  label: string;
}

/** Ctrl shortcuts for Windows and Linux; on macOS the menu bar owns these as Cmd. */
export const SHORTCUTS: Partial<Record<AppCommand, Shortcut>> = {
  compress_image: { key: "o", label: "Ctrl+O" },
  compress_pdf: { key: "o", shift: true, label: "Ctrl+Shift+O" },
  go_home: { key: "1", label: "Ctrl+1" },
  go_history: { key: "2", label: "Ctrl+2" },
  open_settings: { key: ",", label: "Ctrl+," },
};

/** Run `onCommand` for the Ctrl shortcuts above. Pass `enabled: false` to skip. */
export function useShortcuts(onCommand: (command: AppCommand) => void, enabled: boolean) {
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const key = event.key.toLowerCase();
      const match = Object.entries(SHORTCUTS).find(
        ([, s]) => s.key === key && Boolean(s.shift) === event.shiftKey,
      );
      if (!match) return;
      event.preventDefault();
      onCommandRef.current(match[0] as AppCommand);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
