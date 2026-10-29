import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { syncPreferences } from "./features/settings/preferences";
import "./index.css";

syncPreferences();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
