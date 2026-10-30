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
