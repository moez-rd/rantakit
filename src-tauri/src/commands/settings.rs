use rantakit_tasks::{History, Settings, SettingsStore};
use tauri::State;

use crate::error::Result;

#[tauri::command]
pub fn get_settings(settings: State<'_, SettingsStore>) -> Result<Settings> {
    Ok(settings.get()?)
}

/// "Simpan riwayat". Turning it off also clears History; Result files stay.
#[tauri::command]
pub fn set_keep_history(
    settings: State<'_, SettingsStore>,
    history: State<'_, History>,
    keep: bool,
) -> Result<Settings> {
    if !keep {
        history.clear()?;
    }
    Ok(settings.update(|s| s.keep_history = keep)?)
}
