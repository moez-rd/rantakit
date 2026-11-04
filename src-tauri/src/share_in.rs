//! Photos and PDFs shared to Rantakit from another app on Android. The
//! Kotlin side, `SharePlugin.kt`, keeps their `content://` addresses until
//! the frontend takes them, and tells it through "shared-files" when more
//! arrive while the app is running.

use std::path::PathBuf;

use serde_json::json;
use tauri::ipc::Channel;
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
use tauri::{AppHandle, Emitter, Manager, Wry};

struct Plugin(PluginHandle<Wry>);

pub fn init() -> TauriPlugin<Wry> {
    Builder::new("share-in")
        .setup(|app, api| {
            let plugin = api.register_android_plugin("com.rantakit", "SharePlugin")?;
            let emitter = app.clone();
            let handler: Channel = Channel::new(move |_| emitter.emit("shared-files", ()));
            // The Kotlin side runs on the main thread, which setup must not wait for.
            let listening = plugin.clone();
            tauri::async_runtime::spawn(async move {
                let listen = listening.run_mobile_plugin_async::<serde_json::Value>(
                    "listen",
                    json!({ "handler": handler }),
                );
                if let Err(err) = listen.await {
                    eprintln!("share in: listen failed: {err}");
                }
            });
            app.manage(Plugin(plugin));
            Ok(())
        })
        .build()
}

#[derive(serde::Deserialize)]
struct Taken {
    uris: Vec<PathBuf>,
}

/// The files shared since the last call; each is taken once.
pub async fn take(app: &AppHandle) -> Vec<PathBuf> {
    let plugin = &app.state::<Plugin>().0;
    match plugin
        .run_mobile_plugin_async::<Taken>("take", json!({}))
        .await
    {
        Ok(taken) => taken.uris,
        Err(err) => {
            eprintln!("share in: take failed: {err}");
            Vec::new()
        }
    }
}
