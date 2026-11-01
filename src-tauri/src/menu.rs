//! Native menu bar, macOS only. Windows and Linux get an in-app menu instead,
//! see `src/components/layout/AppMenu.tsx`.
//!
//! Links are opened here; the other items are forwarded to the main window as
//! a `menu` event carrying the item id. The labels follow the UI language:
//! the main window calls the `set_menu_language` command on start and on every change.

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

/// Every label in the menu bar, in one language.
struct Labels {
    about: &'static str,
    tagline: &'static str,
    settings: &'static str,
    hide: &'static str,
    hide_others: &'static str,
    show_all: &'static str,
    quit: &'static str,
    file: &'static str,
    compress_image: &'static str,
    compress_pdf: &'static str,
    edit: &'static str,
    cut: &'static str,
    copy: &'static str,
    paste: &'static str,
    select_all: &'static str,
    view: &'static str,
    home: &'static str,
    history: &'static str,
    window: &'static str,
    minimize: &'static str,
    maximize: &'static str,
    close_window: &'static str,
    help: &'static str,
    source: &'static str,
    license: &'static str,
}

const ID: Labels = Labels {
    about: "Tentang Rantakit",
    tagline: "File tetap di perangkatmu.",
    settings: l.settings,
    hide: "Sembunyikan Rantakit",
    hide_others: "Sembunyikan lainnya",
    show_all: "Tampilkan semua",
    quit: "Keluar dari Rantakit",
    file: "File",
    compress_image: "Kompres Foto…",
    compress_pdf: l.compress_pdf,
    edit: "Edit",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    select_all: "Pilih semua",
    view: l.view,
    home: l.home,
    history: "Riwayat",
    window: l.window,
    minimize: "Perkecil",
    maximize: "Perbesar",
    close_window: "Tutup jendela",
    help: l.help,
    source: l.source,
    license: l.license,
};

const EN: Labels = Labels {
    about: "About Rantakit",
    tagline: "Your files stay on your device.",
    settings: "Settings…",
    hide: "Hide Rantakit",
    hide_others: "Hide Others",
    show_all: "Show All",
    quit: "Quit Rantakit",
    file: "File",
    compress_image: "Compress Photo…",
    compress_pdf: "Compress PDF…",
    edit: "Edit",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    select_all: "Select All",
    view: "View",
    home: "Home",
    history: "History",
    window: "Window",
    minimize: "Minimize",
    maximize: "Zoom",
    close_window: "Close Window",
    help: "Help",
    source: "Source Code",
    license: "License",
};

fn labels(language: &str) -> &'static Labels {
    if language == "en" { &EN } else { &ID }
}

/// The menu bar at startup, before the main window says which language it shows.
pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    build_in(app, &ID)
}

/// Rebuilds the menu bar in `language` ("id" or "en").
pub fn set_language<R: Runtime>(app: &AppHandle<R>, language: &str) -> tauri::Result<()> {
    app.set_menu(build_in(app, labels(language))?).map(|_| ())
}

fn build_in<R: Runtime>(app: &AppHandle<R>, l: &Labels) -> tauri::Result<Menu<R>> {
    let about = PredefinedMenuItem::about(
        app,
        Some(l.about),
        Some(AboutMetadata {
            name: Some("Rantakit".into()),
            version: Some(app.package_info().version.to_string()),
            comments: Some(l.tagline.into()),
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
            &MenuItem::with_id(app, OPEN_SETTINGS, l.settings, true, Some("CmdOrCtrl+,"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, Some(l.hide))?,
            &PredefinedMenuItem::hide_others(app, Some(l.hide_others))?,
            &PredefinedMenuItem::show_all(app, Some(l.show_all))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some(l.quit))?,
        ],
    )?;

    let file = Submenu::with_items(
        app,
        l.file,
        true,
        &[
            &MenuItem::with_id(
                app,
                COMPRESS_IMAGE,
                l.compress_image,
                true,
                Some("CmdOrCtrl+O"),
            )?,
            &MenuItem::with_id(
                app,
                COMPRESS_PDF,
                l.compress_pdf,
                true,
                Some("CmdOrCtrl+Shift+O"),
            )?,
        ],
    )?;

    // Without these, copy and paste shortcuts don't work in text fields on macOS.
    let edit = Submenu::with_items(
        app,
        l.edit,
        true,
        &[
            &PredefinedMenuItem::cut(app, Some(l.cut))?,
            &PredefinedMenuItem::copy(app, Some(l.copy))?,
            &PredefinedMenuItem::paste(app, Some(l.paste))?,
            &PredefinedMenuItem::select_all(app, Some(l.select_all))?,
        ],
    )?;

    let view = Submenu::with_items(
        app,
        l.view,
        true,
        &[
            &MenuItem::with_id(app, GO_HOME, l.home, true, Some("CmdOrCtrl+1"))?,
            &MenuItem::with_id(app, GO_RECENTS, l.history, true, Some("CmdOrCtrl+2"))?,
        ],
    )?;

    // Gives Cmd+M and Cmd+W their usual meaning.
    let window = Submenu::with_items(
        app,
        l.window,
        true,
        &[
            &PredefinedMenuItem::minimize(app, Some(l.minimize))?,
            &PredefinedMenuItem::maximize(app, Some(l.maximize))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, Some(l.close_window))?,
        ],
    )?;

    let help = Submenu::with_items(
        app,
        l.help,
        true,
        &[
            &MenuItem::with_id(app, OPEN_SOURCE, l.source, true, None::<&str>)?,
            &MenuItem::with_id(app, OPEN_LICENSE, l.license, true, None::<&str>)?,
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
