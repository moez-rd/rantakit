import { isTauri } from "@tauri-apps/api/core";

/** Set by the Tauri CLI at build time: windows, darwin, linux, android, ios. */
const platform = import.meta.env.TAURI_ENV_PLATFORM ?? "";

/** The Tauri desktop app (as opposed to mobile or a plain browser). */
export const isDesktopApp = isTauri() && !["android", "ios"].includes(platform);

/**
 * The macOS app, which has a native menu bar and draws its content under an
 * overlay title bar. Windows and Linux use the in-app menu instead.
 */
export const isMacApp = isDesktopApp && platform === "darwin";

/** The Android app: no title bar or keyboard shortcuts, Results in `Download/Rantakit/`. */
export const isAndroidApp = isTauri() && platform === "android";

/** The Windows app, the only one with a system share sheet Rantakit can open. */
export const isWindowsApp = isDesktopApp && platform === "windows";
