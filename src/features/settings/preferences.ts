import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type Theme = "light" | "dark" | "system";
export type Language = "id" | "en";

export interface Preferences {
  theme: Theme;
  zoom: number;
  language: Language;
}

export const ZOOM_LEVELS = [0.8, 0.9, 1, 1.1, 1.25, 1.5];

const STORAGE_KEY = "rantakit.preferences";
const CHANGE_EVENT = "rantakit:preferences";
const DEFAULTS: Preferences = { theme: "system", zoom: 1, language: "id" };

export function loadPreferences(): Preferences {
  let stored: Partial<Preferences> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    // unreadable or blocked storage: fall back to defaults
  }
  return {
    theme: ["light", "dark", "system"].includes(stored.theme as string) ? stored.theme! : DEFAULTS.theme,
    zoom: ZOOM_LEVELS.includes(stored.zoom as number) ? stored.zoom! : DEFAULTS.zoom,
    language: stored.language === "en" ? "en" : DEFAULTS.language,
  };
}

export function savePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable: the change still applies to this window
  }
  // `storage` only fires in *other* windows, so notify this one explicitly
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/** Apply preferences to the current window. */
export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark.matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.lang = prefs.language;

  if (isTauri()) {
    // native title bar follows the theme; null means "follow the OS"
    getCurrentWindow()
      .setTheme(prefs.theme === "system" ? null : prefs.theme)
      .catch(() => {});
    getCurrentWebview()
      .setZoom(prefs.zoom)
      .catch(() => {});
  } else {
    root.style.zoom = prefs.zoom === 1 ? "" : String(prefs.zoom);
  }
}

/** Apply now and keep this window in sync with changes from any window or the OS. */
export function syncPreferences() {
  const apply = () => applyPreferences(loadPreferences());
  apply();
  window.addEventListener(CHANGE_EVENT, apply);
  window.addEventListener("storage", (e) => e.key === STORAGE_KEY && apply());
  systemDark.addEventListener("change", apply);
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [prefs, setPrefs] = useState(loadPreferences);

  useEffect(() => {
    const reload = () => setPrefs(loadPreferences());
    window.addEventListener(CHANGE_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(CHANGE_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const update = (patch: Partial<Preferences>) => savePreferences({ ...prefs, ...patch });
  return [prefs, update];
}
