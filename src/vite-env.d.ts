/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set by the Tauri CLI during `tauri dev` / `tauri build`: windows, darwin, linux, android, ios. */
  readonly TAURI_ENV_PLATFORM?: string;
}
