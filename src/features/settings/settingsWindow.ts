import { isTauri } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const LABEL = "settings";

/** True in the Tauri desktop app, where settings open in their own window. */
export const hasSettingsWindow =
  isTauri() && !["android", "ios"].includes(import.meta.env.TAURI_ENV_PLATFORM ?? "");

/** Open the settings window, or focus it if it's already open. */
export async function openSettingsWindow() {
  const existing = await WebviewWindow.getByLabel(LABEL);
  if (existing) {
    await existing.unminimize();
    await existing.setFocus();
    return;
  }

  new WebviewWindow(LABEL, {
    url: "settings.html",
    title: "Pengaturan",
    width: 560,
    height: 440,
    resizable: false,
    minimizable: false,
    maximizable: false,
    center: true,
  });
}
