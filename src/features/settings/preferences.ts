import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Language } from "@/i18n";

export type { Language };
/** What the user chose; "system" follows the operating system language. */
export type LanguageChoice = Language | "system";
export type Theme = "light" | "dark" | "system";
export type TextSize = "normal" | "large" | "larger";

export interface Preferences {
  theme: Theme;
  textSize: TextSize;
  language: LanguageChoice;
}

/** "Besar" scales every text style by 18/16 and "Lebih besar" by 20/16. */
export const TEXT_SCALES: Record<TextSize, number> = { normal: 1, large: 18 / 16, larger: 20 / 16 };

const STORAGE_KEY = "rantakit.preferences";
const CHANGE_EVENT = "rantakit:preferences";
const DEFAULTS: Preferences = { theme: "system", textSize: "normal", language: "system" };

export function loadPreferences(): Preferences {
  let stored: Partial<Preferences> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    // unreadable or blocked storage: fall back to defaults
  }
  return {
    theme: ["light", "dark", "system"].includes(stored.theme as string) ? stored.theme! : DEFAULTS.theme,
    textSize: ["normal", "large", "larger"].includes(stored.textSize as string) ? stored.textSize! : DEFAULTS.textSize,
    language: ["id", "en", "system"].includes(stored.language as string) ? stored.language! : DEFAULTS.language,
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

/** Indonesian when the operating system is set to Indonesian, English otherwise. */
export function systemLanguage(): Language {
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function resolveLanguage(choice: LanguageChoice): Language {
  return choice === "system" ? systemLanguage() : choice;
}

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

/** Apply preferences to the current window. */
export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark.matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.lang = resolveLanguage(prefs.language);
  root.style.setProperty("--text-scale", String(TEXT_SCALES[prefs.textSize]));

  if (isTauri()) {
    // native title bar follows the theme; null means "follow the OS"
    getCurrentWindow()
      .setTheme(prefs.theme === "system" ? null : prefs.theme)
      .catch(() => {});
  }
}

/** Apply now and keep this window in sync with changes from any window or the OS. */
export function syncPreferences() {
  const apply = () => applyPreferences(loadPreferences());
  apply();
  window.addEventListener(CHANGE_EVENT, apply);
  window.addEventListener("storage", (e) => e.key === STORAGE_KEY && apply());
  systemDark.addEventListener("change", apply);
  window.addEventListener("languagechange", apply);
}

/** Call `onChange` when preferences or the system language change. Returns the unsubscribe. */
export function subscribePreferences(onChange: () => void) {
  const events = [CHANGE_EVENT, "storage", "languagechange"];
  for (const event of events) window.addEventListener(event, onChange);
  return () => {
    for (const event of events) window.removeEventListener(event, onChange);
  };
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [prefs, setPrefs] = useState(loadPreferences);

  useEffect(() => subscribePreferences(() => setPrefs(loadPreferences())), []);

  const update = (patch: Partial<Preferences>) => savePreferences({ ...prefs, ...patch });
  return [prefs, update];
}
