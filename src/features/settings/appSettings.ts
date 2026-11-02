import { useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { currentTranslator } from "@/i18n";

/** Mirrors `Settings` in crates/rantakit-tasks/src/settings.rs: what the backend acts on. */
export interface AppSettings {
  /** "Simpan riwayat". */
  keepHistory: boolean;
  /** "Di folder pilihan"; null saves each Result next to its Original. */
  resultsFolder: string | null;
}

const CHANGE_EVENT = "rantakit:app-settings";
let cached: AppSettings | null = null;

function publish(settings: AppSettings) {
  cached = settings;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return settings;
}

/** The backend's settings, null until read; every user of the hook sees changes at once. */
export function useAppSettings() {
  const [settings, setSettings] = useState(cached);
  useEffect(() => {
    const sync = () => setSettings(cached);
    window.addEventListener(CHANGE_EVENT, sync);
    invoke<AppSettings>("get_settings")
      .then(publish)
      .catch(() => {});
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);
  return settings;
}

/** Turning History off also clears it; Result files stay. */
export function setKeepHistory(keep: boolean) {
  return invoke<AppSettings>("set_keep_history", { keep }).then(publish);
}

/** A folder for every Result, or null for next to each Original. */
export function setResultsFolder(folder: string | null) {
  return invoke<AppSettings>("set_results_folder", { folder }).then(publish);
}

/** Ask the user for the Results folder. Null when cancelled. */
export async function pickResultsFolder(): Promise<string | null> {
  if (!isTauri()) return import.meta.env.DEV ? "C:\\Users\\Rani\\Documents\\Hasil Rantakit" : null;
  return open({ title: currentTranslator().t("settings.results.pick"), directory: true, multiple: false });
}
