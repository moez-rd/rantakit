mod commands;
mod error;
mod history;
#[cfg(desktop)]
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

    #[cfg(desktop)]
    let builder = builder
        .menu(menu::build)
        .on_menu_event(menu::handle_event)
        // Windows and Linux attach the app menu to every window; settings doesn't need it.
        .on_page_load(|webview, _| {
            if webview.label() == "settings" {
                let _ = webview.window().remove_menu();
            }
        });

    builder
        .invoke_handler(tauri::generate_handler![
            commands::image::compress_image,
            commands::history::list_history,
            commands::history::remove_history,
            commands::history::clear_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
