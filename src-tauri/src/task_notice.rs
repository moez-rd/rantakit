//! A Task's notification on Android. Every Task runs while `TaskService.kt`
//! holds a foreground service, so it keeps going when the user switches apps;
//! its notification shows the progress, then "Selesai" when the Task ends out
//! of sight. The words follow the UI language set with `set_language`.

use std::time::{Duration, Instant};

use rantakit_tasks::{ErrorKind, FileOutcome, ToolId};
use serde::Serialize;
use serde_json::{Value, json};
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
use tauri::{AppHandle, Manager, Wry};

use crate::commands::language::Language;
use crate::notice_words::{EN, ID, Words, done_title, progress_title};

fn words(app: &AppHandle) -> &'static Words {
    if app.state::<Language>().is_english() {
        &EN
    } else {
        &ID
    }
}

/// The Kotlin side, `TaskPlugin.kt`.
struct Plugin(PluginHandle<Wry>);

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("task-notice")
        .setup(|app, api| {
            app.manage(Plugin(
                api.register_android_plugin("com.rantakit", "TaskPlugin")?,
            ));
            Ok(())
        })
        .build()
}

/// Waits for the Kotlin side, which runs on the main thread; called from the Task's own thread.
fn call<T: serde::de::DeserializeOwned>(
    app: &AppHandle,
    command: &str,
    args: impl Serialize,
) -> Option<T> {
    match app.state::<Plugin>().0.run_mobile_plugin(command, args) {
        Ok(value) => Some(value),
        Err(err) => {
            eprintln!("task notice: {command} failed: {err}");
            None
        }
    }
}

/// For commands, which may run on the main thread that the Kotlin side needs.
async fn call_async(app: &AppHandle, command: &str) -> Option<Value> {
    let plugin = &app.state::<Plugin>().0;
    match plugin.run_mobile_plugin_async(command, json!({})).await {
        Ok(value) => Some(value),
        Err(err) => {
            eprintln!("task notice: {command} failed: {err}");
            None
        }
    }
}

/// "granted", "ask" (Android 13 and later, before the first Task), or "refused".
pub async fn permission(app: &AppHandle) -> String {
    call_async(app, "notificationPermission")
        .await
        .and_then(|value| value["state"].as_str().map(String::from))
        .unwrap_or_else(|| "granted".into())
}

/// Shows Android's prompt; whether notifications may be shown.
pub async fn ask_permission(app: &AppHandle) -> bool {
    call_async(app, "askNotificationPermission")
        .await
        .and_then(|value| value["granted"].as_bool())
        .unwrap_or(false)
}

/// How often the progress notification may change; Android drops faster updates.
const EVERY: Duration = Duration::from_millis(500);

/// The notification of one running Task.
pub struct Notice {
    app: AppHandle,
    tool: ToolId,
    files: usize,
    shown: (Instant, String, u32),
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Start<'a> {
    title: &'a str,
    value: u32,
    running_channel: &'a str,
    finished_channel: &'a str,
}

impl Notice {
    /// Starts the foreground service. Called as the Task starts, while the
    /// app is on screen, since Android 12 and later forbid it from the background.
    pub fn start(app: &AppHandle, tool: ToolId, files: usize) -> Self {
        let words = words(app);
        let title = progress_title(words, tool, 0, files);
        call::<Value>(
            app,
            "start",
            Start {
                title: &title,
                value: 0,
                running_channel: words.running,
                finished_channel: words.finished,
            },
        );
        Self {
            app: app.clone(),
            tool,
            files,
            shown: (Instant::now(), title, 0),
        }
    }

    /// The `file`th file is `fraction` done.
    pub fn progress(&mut self, file: usize, fraction: f32) {
        let title = progress_title(words(&self.app), self.tool, file, self.files);
        let value =
            ((file as f32 + fraction.clamp(0.0, 1.0)) / self.files.max(1) as f32 * 1000.0) as u32;
        let (at, shown_title, shown_value) = &self.shown;
        let changed = title != *shown_title || value != *shown_value;
        if !changed || (title == *shown_title && at.elapsed() < EVERY) {
            return;
        }
        call::<Value>(
            &self.app,
            "progress",
            json!({ "title": title, "value": value }),
        );
        self.shown = (Instant::now(), title, value);
    }

    /// Stops the service; if Rantakit is out of sight, "Selesai" takes the
    /// progress notification's place.
    pub fn finish(self, outcomes: &[FileOutcome]) {
        let results = outcomes.iter().filter(|outcome| outcome.is_ok()).count();
        let failed = outcomes
            .iter()
            .filter(|outcome| {
                matches!(outcome, Err(kind) if !matches!(kind, ErrorKind::Unchanged | ErrorKind::Cancelled))
            })
            .count();
        let title = done_title(words(&self.app), results, failed);
        call::<Value>(&self.app, "finish", json!({ "title": title }));
    }
}
