use rantakit_tasks::RecentLimits;
use tauri::State;

use crate::error::Result;

/// The last Size limits used, in bytes, newest first.
#[tauri::command]
pub fn recent_limits(limits: State<'_, RecentLimits>) -> Result<Vec<u64>> {
    Ok(limits.list()?)
}
