use rantakit_tasks::{RecentLimits, RecentTools};
use tauri::State;

use crate::error::Result;

/// The last Size limits used, in bytes, newest first.
#[tauri::command]
pub fn recent_limits(limits: State<'_, RecentLimits>) -> Result<Vec<u64>> {
    Ok(limits.list()?)
}

/// The last Tools used, newest first, for "Terakhir dipakai" (Recent tools).
/// Kept even while History is off.
#[tauri::command]
pub fn recent_tools(tools: State<'_, RecentTools>) -> Result<Vec<String>> {
    Ok(tools.list()?)
}
