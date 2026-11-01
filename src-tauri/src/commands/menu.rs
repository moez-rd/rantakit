use tauri::{AppHandle, Runtime};

/// Shows the native menu bar in the UI language ("id" or "en"). Only macOS has
/// one; elsewhere this does nothing.
#[tauri::command]
pub fn set_menu_language<R: Runtime>(app: AppHandle<R>, language: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    return crate::menu::set_language(&app, &language).map_err(|err| err.to_string());

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, language);
        Ok(())
    }
}
