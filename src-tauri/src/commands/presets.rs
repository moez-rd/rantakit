use rantakit_tasks::{Preset, Presets};
use serde_json::Value;
use tauri::State;

use crate::error::Result;

/// One Tool's Presets, oldest first.
#[tauri::command]
pub fn list_presets(presets: State<'_, Presets>, tool: String) -> Result<Vec<Preset>> {
    Ok(presets.list(&tool)?)
}

#[tauri::command]
pub fn save_preset(
    presets: State<'_, Presets>,
    tool: String,
    name: String,
    options: Value,
) -> Result<Preset> {
    Ok(presets.save(&tool, &name, options)?)
}

#[tauri::command]
pub fn rename_preset(presets: State<'_, Presets>, id: String, name: String) -> Result<()> {
    Ok(presets.rename(&id, &name)?)
}

#[tauri::command]
pub fn remove_preset(presets: State<'_, Presets>, id: String) -> Result<()> {
    Ok(presets.remove(&id)?)
}
