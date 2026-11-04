use std::sync::Mutex;

use tauri::{AppHandle, Manager, Runtime};

/// The UI language, "id" or "en", for the words Rust shows itself: the
/// macOS menu bar and the Task notifications on Android.
#[derive(Default)]
pub struct Language(Mutex<Option<String>>);

impl Language {
    /// Whether the UI is in English; Indonesian until the frontend says otherwise.
    #[cfg_attr(not(target_os = "android"), allow(dead_code))]
    pub fn is_english(&self) -> bool {
        self.0.lock().unwrap_or_else(|e| e.into_inner()).as_deref() == Some("en")
    }
}

/// The main window calls this on start and on every language change.
#[tauri::command]
pub fn set_language<R: Runtime>(app: AppHandle<R>, language: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    crate::menu::set_language(&app, &language).map_err(|err| err.to_string())?;

    *app.state::<Language>()
        .0
        .lock()
        .unwrap_or_else(|e| e.into_inner()) = Some(language);
    Ok(())
}
