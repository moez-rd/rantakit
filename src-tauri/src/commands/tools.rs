use std::path::PathBuf;

use rantakit_tasks::{Availability, FileKind, FileMatch, Platform, ToolId, tools_for};
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

#[derive(Debug, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum DropMatch {
    Fits {
        kinds: Vec<&'static str>,
        tools: Vec<&'static str>,
    },
    Unsupported,
    Mixed,
}

/// Which shipped Tools can take every one of `paths`, judged by content.
/// Asked while files are dragged over the window, so it runs off the main thread.
#[tauri::command]
pub async fn match_files(paths: Vec<PathBuf>) -> DropMatch {
    match rantakit_tasks::match_files(&paths, Platform::current()) {
        FileMatch::Fits { kinds, tools } => DropMatch::Fits {
            kinds: kinds.into_iter().map(FileKind::as_str).collect(),
            tools: tools.into_iter().map(ToolId::as_str).collect(),
        },
        FileMatch::Unsupported => DropMatch::Unsupported,
        FileMatch::Mixed => DropMatch::Mixed,
    }
}
