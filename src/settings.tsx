import React from "react";
import ReactDOM from "react-dom/client";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import { syncPreferences } from "./features/settings/preferences";
import "./index.css";

// Entry point for the desktop settings window (settings.html).
syncPreferences();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="h-full overflow-auto p-5">
      <SettingsPanel />
    </div>
  </React.StrictMode>,
);
