import { invoke, isTauri } from "@tauri-apps/api/core";

/** Mirrors `HistoryItem` in `src-tauri/src/commands/history.rs`. */
export interface HistoryItem {
  id: string;
  /** Unix time in milliseconds. */
  createdAt: number;
  inputPath: string;
  outputPath: string;
  originalBytes: number;
  compressedBytes: number;
  format: "jpeg" | "png";
  width: number;
  height: number;
  quality: number | null;
  /** False when the compressed copy was moved or deleted since. */
  outputExists: boolean;
}

/** Newest first. Empty outside Tauri. */
export async function listHistory(): Promise<HistoryItem[]> {
  return isTauri() ? invoke<HistoryItem[]>("list_history") : [];
}

export function removeHistory(id: string) {
  return invoke<void>("remove_history", { id });
}

export function clearHistory() {
  return invoke<void>("clear_history");
}
