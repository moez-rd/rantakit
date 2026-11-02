import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "@keyline-icons/react";
import { Button } from "react-aria-components";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";

/** Window control, 28 px square. */
const control = tv({
  extend: focusRing,
  base: [
    "flex size-7 rounded-lg items-center justify-center text-text-muted",
    "cursor-default select-none transition-colors",
    "hover:bg-badge-bg hover:text-text pressed:bg-badge-bg",
  ],
  variants: {
    close: { true: "hover:bg-danger hover:text-on-danger pressed:bg-danger-hover" },
  },
});

/**
 * Title bar for Windows and Linux, where the window has no OS decorations.
 * The empty strip moves the window; a double-click maximizes it.
 */
export function TitleBar() {
  const { t } = useT();
  // getCurrentWindow() returns a new object on every call: keep one, or the
  // effect below would re-run after every render.
  const [appWindow] = useState(getCurrentWindow);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const sync = () => appWindow.isMaximized().then(setIsMaximized);
    sync();
    const unlisten = appWindow.onResized(sync);
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  return (
    <header data-tauri-drag-region className="flex h-9 shrink-0 items-center gap-2 px-1.5">
      {/* Clicks pass through the title to the drag region behind it. */}
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-center ps-1.5">
        <span className="pointer-events-none truncate select-none font-display text-small font-semibold tracking-wide text-text-muted">
          rantakit
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button aria-label={t("window.minimize")} onPress={() => appWindow.minimize()} className={(rp) => control(rp)}>
          <Minus aria-hidden className="size-4" />
        </Button>
        <Button
          aria-label={t(isMaximized ? "window.restore" : "window.maximize")}
          onPress={() => appWindow.toggleMaximize()}
          className={(rp) => control(rp)}
        >
          {isMaximized ? <Copy aria-hidden className="size-3.5" /> : <Square aria-hidden className="size-3.5" />}
        </Button>
        <Button
          aria-label={t("window.close")}
          onPress={() => appWindow.close()}
          className={(rp) => control({ ...rp, close: true })}
        >
          <X aria-hidden className="size-4" />
        </Button>
      </div>
    </header>
  );
}
