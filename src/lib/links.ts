import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

// Keep in sync with the macOS menu in src-tauri/src/menu.rs.
export const SOURCE_URL = "https://github.com/moez-rd/dikompres";
export const LICENSE_URL = "https://www.gnu.org/licenses/agpl-3.0.html";

/** Open a link in the user's browser. */
export function openExternal(url: string) {
  return isTauri() ? openUrl(url) : window.open(url, "_blank", "noopener");
}
