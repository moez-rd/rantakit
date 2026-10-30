//! Native menu bar, macOS only. Windows and Linux get an in-app menu instead,
//! see `src/components/layout/AppMenu.tsx`.
//!
//! Links are opened here; the other items are forwarded to the main window as
//! a `menu` event carrying the item id.

use tauri::menu::{AboutMetadata, Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_opener::OpenerExt;

pub const COMPRESS_IMAGE: &str = "compress_image";
pub const COMPRESS_PDF: &str = "compress_pdf";
pub const GO_HOME: &str = "go_home";
pub const GO_RECENTS: &str = "go_recents";
pub const OPEN_SOURCE: &str = "open_source";
pub const OPEN_LICENSE: &str = "open_license";
pub const OPEN_SETTINGS: &str = "open_settings";

/// Event the main window listens to for the items it handles.
const MENU_EVENT: &str = "menu";
const SOURCE_URL: &str = "https://github.com/moez-rd/rantakit";
const LICENSE_URL: &str = "https://www.gnu.org/licenses/agpl-3.0.html";

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let about = PredefinedMenuItem::about(
        app,
        Some("Tentang Rantakit"),
        Some(AboutMetadata {
            name: Some("Rantakit".into()),
            version: Some(app.package_info().version.to_string()),
            comments: Some("Kompres berkas, tetap di perangkatmu.".into()),
            license: Some("AGPL-3.0-or-later".into()),
            ..Default::default()
        }),
    )?;

    let app_menu = Submenu::with_items(
        app,
        "Rantakit",
        true,
        &[
            &about,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, OPEN_SETTINGS, "Pengaturan…", true, Some("CmdOrCtrl+,"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, Some("Sembunyikan Rantakit"))?,
            &PredefinedMenuItem::hide_others(app, Some("Sembunyikan lainnya"))?,
            &PredefinedMenuItem::show_all(app, Some("Tampilkan semua"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Keluar dari Rantakit"))?,
        ],
    )?;

    let file = Submenu::with_items(
        app,
        "Berkas",
        true,
        &[
            &MenuItem::with_id(app, COMPRESS_IMAGE, "Kompres gambar…", true, Some("CmdOrCtrl+O"))?,
            &MenuItem::with_id(app, COMPRESS_PDF, "Kompres PDF…", true, Some("CmdOrCtrl+Shift+O"))?,
        ],
    )?;

    // Without these, copy and paste shortcuts don't work in text fields on macOS.
    let edit = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::cut(app, Some("Potong"))?,
            &PredefinedMenuItem::copy(app, Some("Salin"))?,
            &PredefinedMenuItem::paste(app, Some("Tempel"))?,
            &PredefinedMenuItem::select_all(app, Some("Pilih semua"))?,
        ],
    )?;

    let view = Submenu::with_items(
        app,
        "Tampilan",
        true,
        &[
            &MenuItem::with_id(app, GO_HOME, "Beranda", true, Some("CmdOrCtrl+1"))?,
            &MenuItem::with_id(app, GO_RECENTS, "Terbaru", true, Some("CmdOrCtrl+2"))?,
        ],
    )?;

    // Gives Cmd+M and Cmd+W their usual meaning.
    let window = Submenu::with_items(
        app,
        "Jendela",
        true,
        &[
            &PredefinedMenuItem::minimize(app, Some("Perkecil"))?,
            &PredefinedMenuItem::maximize(app, Some("Perbesar"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, Some("Tutup jendela"))?,
        ],
    )?;

    let help = Submenu::with_items(
        app,
        "Bantuan",
        true,
        &[
            &MenuItem::with_id(app, OPEN_SOURCE, "Kode sumber", true, None::<&str>)?,
            &MenuItem::with_id(app, OPEN_LICENSE, "Lisensi", true, None::<&str>)?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &file, &edit, &view, &window, &help])
}

pub fn handle_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    match event.id().as_ref() {
        OPEN_SOURCE => open_url(app, SOURCE_URL),
        OPEN_LICENSE => open_url(app, LICENSE_URL),
        id @ (COMPRESS_IMAGE | COMPRESS_PDF | GO_HOME | GO_RECENTS | OPEN_SETTINGS) => {
            if let Err(err) = app.emit_to("main", MENU_EVENT, id) {
                eprintln!("failed to forward menu item {id}: {err}");
            }
        }
        _ => {}
    }
}

fn open_url<R: Runtime>(app: &AppHandle<R>, url: &str) {
    if let Err(err) = app.opener().open_url(url, None::<&str>) {
        eprintln!("failed to open {url}: {err}");
    }
}
