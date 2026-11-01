use rantakit_tasks::{Availability, Platform, tools_for};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolInfo {
    pub id: &'static str,
    pub job: &'static str,
    pub coming_soon: bool,
}

/// The Tools to list on this platform, in catalogue order. Names, descriptions,
/// and icons come from the frontend, keyed by `id`.
#[tauri::command]
pub fn list_tools() -> Vec<ToolInfo> {
    tools_for(Platform::current())
        .map(|tool| ToolInfo {
            id: tool.id.as_str(),
            job: tool.job.as_str(),
            coming_soon: tool.availability == Availability::ComingSoon,
        })
        .collect()
}
