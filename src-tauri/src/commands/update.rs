//! "Versi baru": asks GitHub's latest release whether a newer Rantakit is out,
//! and installs it when the user agrees. The request carries nothing but the
//! app's version and platform, and is never made while the user has the check
//! turned off (ADR 0001). Stores update the mobile apps, so there it finds nothing.

use rantakit_tasks::SettingsStore;
use serde::Serialize;
use tauri::{AppHandle, State};

use crate::error::Result;

/// A newer version, for the title bar notice.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewVersion {
    version: String,
    /// False where Rantakit can't replace itself (the Linux .deb and .rpm,
    /// which belong to the package manager): the notice links to the
    /// download page instead.
    can_install: bool,
}

/// The update found at launch, kept for `install_update`.
#[derive(Default)]
pub struct PendingUpdate(#[cfg(desktop)] std::sync::Mutex<Option<tauri_plugin_updater::Update>>);

/// Called once at launch. `None` when the check is off, nothing is newer, or
/// on mobile.
#[tauri::command]
pub async fn check_update(
    app: AppHandle,
    settings: State<'_, SettingsStore>,
    pending: State<'_, PendingUpdate>,
) -> Result<Option<NewVersion>> {
    if !settings.get()?.check_updates {
        return Ok(None);
    }
    find(&app, &pending).await
}

/// Downloads and installs the update found at launch, then restarts
/// Rantakit. On Windows the installer closes the app itself.
#[tauri::command]
pub async fn install_update(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<()> {
    install(&app, &pending).await
}

#[cfg(desktop)]
async fn find(app: &AppHandle, pending: &PendingUpdate) -> Result<Option<NewVersion>> {
    use tauri_plugin_updater::UpdaterExt;

    let Some(update) = app.updater()?.check().await? else {
        return Ok(None);
    };
    let found = NewVersion {
        version: update.version.clone(),
        // On Linux only the AppImage replaces itself; it sets APPIMAGE.
        can_install: !cfg!(target_os = "linux") || std::env::var_os("APPIMAGE").is_some(),
    };
    *pending.0.lock().unwrap() = Some(update);
    Ok(Some(found))
}

#[cfg(desktop)]
async fn install(app: &AppHandle, pending: &PendingUpdate) -> Result<()> {
    // Cloned, not taken, so a failed download can be tried again.
    let update = pending.0.lock().unwrap().clone();
    let Some(update) = update else {
        return Ok(());
    };
    update.download_and_install(|_, _| {}, || {}).await?;
    app.restart()
}

#[cfg(mobile)]
async fn find(_: &AppHandle, _: &PendingUpdate) -> Result<Option<NewVersion>> {
    Ok(None)
}

#[cfg(mobile)]
async fn install(_: &AppHandle, _: &PendingUpdate) -> Result<()> {
    Ok(())
}
