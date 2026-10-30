mod commands;
mod error;
mod history;
#[cfg(target_os = "macos")]
mod menu;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("history.json");
            app.manage(history::History::new(path));
            Ok(())
        });

    // Only macOS gets a native menu bar; Windows and Linux use the in-app menu.
    #[cfg(target_os = "macos")]
    let builder = builder.menu(menu::build).on_menu_event(menu::handle_event);

    builder
        .invoke_handler(tauri::generate_handler![
            commands::image::compress_image,
            commands::history::list_history,
            commands::history::remove_history,
            commands::history::clear_history,
            commands::pdf::compress_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
