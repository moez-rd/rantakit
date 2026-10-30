import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import { syncPreferences } from "./features/settings/preferences";
import { initialSettingsTab, SHOW_TAB_EVENT, type SettingsTab } from "./features/settings/settingsWindow";
import "./index.css";

// Entry point for the desktop settings window (settings.html).
syncPreferences();

function SettingsWindow() {
  const [tab, setTab] = useState(initialSettingsTab);

  // The main window asks for a tab when the window is already open (e.g. "About").
  useEffect(() => {
    if (!isTauri()) return;
    const unlisten = getCurrentWebviewWindow().listen<SettingsTab>(SHOW_TAB_EVENT, (event) =>
      setTab(event.payload),
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="h-full overflow-auto p-5">
      <SettingsPanel tab={tab} onTabChange={setTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsWindow />
  </React.StrictMode>,
);
