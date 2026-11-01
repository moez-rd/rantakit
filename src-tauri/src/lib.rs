mod commands;
mod error;
#[cfg(target_os = "macos")]
mod menu;

use rantakit_tasks::History;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("history.json");
            app.manage(History::new(path));
            app.manage(commands::task::RunningTasks::default());
            Ok(())
        });

    // Only macOS gets a native menu bar; Windows and Linux use the in-app menu.
    #[cfg(target_os = "macos")]
    let builder = builder.menu(menu::build).on_menu_event(menu::handle_event);

    builder
        .invoke_handler(tauri::generate_handler![
            commands::files::file_info,
            commands::files::thumbnail,
            commands::files::open_path,
            commands::menu::set_menu_language,
            commands::tools::list_tools,
            commands::tools::match_files,
            commands::task::start_task,
            commands::task::cancel_task,
            commands::history::list_history,
            commands::history::remove_history,
            commands::history::clear_history,
            commands::history::recent_tools,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
