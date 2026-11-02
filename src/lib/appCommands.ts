import { useEffect, useRef } from "react";

/**
 * Everything the menus and shortcuts can do. The macOS menu bar sends all but
 * the links and "open_about" as `menu` events (see src-tauri/src/menu.rs).
 */
export type AppCommand =
  | "compress_image"
  | "compress_pdf"
  | "go_home"
  | "go_history"
  | "go_back"
  | "go_forward"
  | "toggle_sidebar"
  | "open_settings"
  | "open_source"
  | "open_license"
  | "open_about";

interface Shortcut {
  /** `KeyboardEvent.key`, lower-cased. */
  key: string;
  shift?: boolean;
  /** Alt in place of Ctrl. */
  alt?: boolean;
  /** Shown next to the menu item. */
  label: string;
}

/** Shortcuts for Windows and Linux; on macOS the menu bar owns these as Cmd. */
export const SHORTCUTS: Partial<Record<AppCommand, Shortcut>> = {
  compress_image: { key: "o", label: "Ctrl+O" },
  compress_pdf: { key: "o", shift: true, label: "Ctrl+Shift+O" },
  go_home: { key: "1", label: "Ctrl+1" },
  go_history: { key: "2", label: "Ctrl+2" },
  go_back: { key: "arrowleft", alt: true, label: "Alt+←" },
  go_forward: { key: "arrowright", alt: true, label: "Alt+→" },
  toggle_sidebar: { key: "b", label: "Ctrl+B" },
  open_settings: { key: ",", label: "Ctrl+," },
};

/** Run `onCommand` for the shortcuts above. Pass `enabled: false` to skip. */
export function useShortcuts(onCommand: (command: AppCommand) => void, enabled: boolean) {
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey === event.altKey || event.metaKey || event.repeat) return;
      const key = event.key.toLowerCase();
      const match = Object.entries(SHORTCUTS).find(
        ([, s]) => s.key === key && Boolean(s.shift) === event.shiftKey && Boolean(s.alt) === event.altKey,
      );
      if (!match) return;
      event.preventDefault();
      onCommandRef.current(match[0] as AppCommand);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
