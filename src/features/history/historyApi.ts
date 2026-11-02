import { invoke } from "@tauri-apps/api/core";

/** Mirrors `HistoryFile` in `src-tauri/src/commands/history.rs`. */
export interface HistoryFile {
  originalPath: string;
  resultPath: string;
  originalBytes: number;
  resultBytes: number;
  /** False when the Result was moved or deleted since. */
  exists: boolean;
}

/** Mirrors `HistoryItem`: one Task and each of its Results. */
export interface HistoryItem {
  id: string;
  /** A `ToolId`; History may name Tools this build doesn't know. */
  tool: string;
  /** Unix time in milliseconds. */
  createdAt: number;
  files: HistoryFile[];
}

/** Newest first. */
export function listHistory() {
  return invoke<HistoryItem[]>("list_history");
}

export function clearHistory() {
  return invoke<void>("clear_history");
}
