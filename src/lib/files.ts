import { invoke } from "@tauri-apps/api/core";

/** Opens a file in the app the system uses for it. */
export function openPath(path: string) {
  invoke("open_path", { path }).catch(() => {});
}

/** "Bagikan": the system share sheet with every file as one share, on Windows and Android. */
export function shareFiles(paths: string[]) {
  invoke("share_files", { paths }).catch(() => {});
}
