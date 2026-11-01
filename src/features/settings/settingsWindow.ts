import { emitTo } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentTranslator } from "@/i18n";
import { isDesktopApp } from "@/lib/platform";

const LABEL = "settings";
/** Sent to an open settings window to switch tabs. */
export const SHOW_TAB_EVENT = "settings:show-tab";

export type SettingsTab = "general" | "about";

/** True in the Tauri desktop app, where settings open in their own window. */
export const hasSettingsWindow = isDesktopApp;

/** Open the settings window on `tab`, or focus it if it's already open. */
export async function openSettingsWindow(tab: SettingsTab = "general") {
  const existing = await WebviewWindow.getByLabel(LABEL);
  if (existing) {
    await emitTo(LABEL, SHOW_TAB_EVENT, tab);
    await existing.unminimize();
    await existing.setFocus();
    return;
  }

  new WebviewWindow(LABEL, {
    url: `settings.html#${tab}`,
    title: currentTranslator().t("settings.title"),
    width: 560,
    height: 520,
    resizable: false,
    minimizable: false,
    maximizable: false,
    center: true,
  });
}

/** The tab a new settings window was opened on. */
export function initialSettingsTab(): SettingsTab {
  return location.hash === "#about" ? "about" : "general";
}
