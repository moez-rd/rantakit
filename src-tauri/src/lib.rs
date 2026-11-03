mod commands;
mod error;
#[cfg(target_os = "macos")]
mod menu;

use rantakit_tasks::{History, Presets, RecentLimits, RecentTools, SettingsStore};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let data = app.path().app_data_dir()?;
            app.manage(History::new(data.join("history.json")));
            app.manage(RecentLimits::limits(data.join("recent-limits.json")));
            app.manage(RecentTools::tools(data.join("recent-tools.json")));
            app.manage(SettingsStore::new(data.join("settings.json")));
            app.manage(Presets::new(data.join("presets.json")));
            app.manage(commands::task::RunningTasks::default());
            app.manage(commands::update::PendingUpdate::default());
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                round_corners(&window);
            }
            Ok(())
        });

    // Stores update the mobile apps.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    // Only macOS gets a native menu bar; Windows and Linux use the in-app menu.
    #[cfg(target_os = "macos")]
    let builder = builder.menu(menu::build).on_menu_event(menu::handle_event);

    builder
        .invoke_handler(tauri::generate_handler![
            commands::files::file_info,
            commands::files::thumbnail,
            commands::files::open_path,
            commands::share::share_files,
            commands::menu::set_menu_language,
            commands::tools::list_tools,
            commands::tools::match_files,
            commands::task::start_task,
            commands::task::cancel_task,
            commands::history::list_history,
            commands::history::clear_history,
            commands::recent::recent_limits,
            commands::recent::recent_tools,
            commands::settings::get_settings,
            commands::settings::set_keep_history,
            commands::settings::set_results_folder,
            commands::settings::set_check_updates,
            commands::update::check_update,
            commands::update::install_update,
            commands::presets::list_presets,
            commands::presets::save_preset,
            commands::presets::rename_preset,
            commands::presets::remove_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Asks Windows 11 to round the undecorated window like a native one (about
/// 8 px). Windows 10 ignores it and keeps square corners.
#[cfg(windows)]
fn round_corners(window: &tauri::WebviewWindow) {
    use windows::Win32::Graphics::Dwm::{
        DWM_WINDOW_CORNER_PREFERENCE, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_ROUND,
        DwmSetWindowAttribute,
    };
    let Ok(hwnd) = window.hwnd() else { return };
    let preference = DWMWCP_ROUND;
    // Cosmetic only: a failure leaves the system default corners.
    let _ = unsafe {
        DwmSetWindowAttribute(
            hwnd,
            DWMWA_WINDOW_CORNER_PREFERENCE,
            (&raw const preference).cast(),
            size_of::<DWM_WINDOW_CORNER_PREFERENCE>() as u32,
        )
    };
}
