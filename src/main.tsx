import React from "react";
import { isTauri } from "@tauri-apps/api/core";
import ReactDOM from "react-dom/client";
import App from "./App";
import { syncPreferences } from "./features/settings/preferences";
import "./index.css";

declare global {
  interface Window {
    /** Set by index.html when the web view is too old for Rantakit's styles. */
    __RANTAKIT_UNSUPPORTED__?: boolean;
  }
}

// index.html already shows the "needs a newer WebView" message.
if (!window.__RANTAKIT_UNSUPPORTED__) {
  syncPreferences();

  // In a plain browser during development, a stand-in backend answers commands.
  const backend = import.meta.env.DEV && !isTauri() ? import("./lib/devMocks").then((m) => m.installDevMocks()) : null;

  Promise.resolve(backend).then(() =>
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    ),
  );
}
