import { invoke } from "@tauri-apps/api/core";

/** Opens a file in the app the system uses for it. */
export function openPath(path: string) {
  invoke("open_path", { path }).catch(() => {});
}
