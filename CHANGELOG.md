# Changelog

All notable changes to Rantakit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- "Versi baru" (New version): at launch Rantakit checks GitHub for a newer version and shows a quiet button in the title bar. On Windows and the Linux AppImage one click installs it; the .deb and .rpm open the download page. It can be turned off in Settings, under "Tentang" (About)
- Android: photos and PDFs are chosen with the system file picker, keep their real names, are read where they are, and every Result is saved as a new file in `Download/Rantakit/`, where Gallery and Files find it. Android 8 and 9 ask for the storage permission at the first Task, after saying why
- Android APKs on every release, signed with one release key so each new version installs over the last and keeps History, Presets, and Settings: `Rantakit_<version>_arm64.apk` for almost every phone, and `Rantakit_<version>_armv7.apk` for older ones
- Android phone layout: the Tool page is one column with the main button at the bottom, and the Result is its own screen, where "Buka" (Open) asks which app to open it in and "Bagikan" (Share) opens the share sheet. Settings is a page listing its parts, without "File hasil" (Result files), since Results always go to `Download/Rantakit/`
- Android back gesture: it closes an open dialog first, then goes back one step as Back does on desktop, asking first before files would be lost; on Home it closes the app
- Android tablets and phones turned sideways use the wide layout from 768 px, and turning the phone keeps the files, options, and a running Task
- "Bagikan semua" (Share all) above a list of Results, on Windows and Android
- Android Tasks keep going when you switch apps, with a notification such as "Kompres Foto · 3 dari 12 file" (Compress Photo · 3 of 12 files). If Rantakit is out of sight when the Task ends, "Selesai" (Done) says how many Results are in `Download/Rantakit/` and how many files failed, and tapping it shows the Result. Android 13 and later ask once, at the first Task, whether Rantakit may show notifications, after saying why
- Android share sheet: photos and PDFs shared from WhatsApp, Gallery, Files, or any other app open in Rantakit, which shows the Tools that fit them or why none does. Rantakit can be closed, in the background, or open; while a Task runs it asks you to wait for it first
- History on Android and Windows has "Bagikan" (Share) for a Result and "Bagikan semua" (Share all) for a Task with several, next to "Buka". On a phone each entry's buttons sit under its file names, and a Result moved or deleted in another app is marked as missing as soon as you come back to Rantakit
- "Versi baru" on Android: the APK from GitHub checks for a newer release at launch and shows a button at the top of Home. Its dialog says to download the new APK and install it, keeping History and settings, and opens the release page. "Cek versi baru" in Settings, under "Tentang", turns it off

### Changed

- Only release candidates, such as `v0.3.0-rc.1`, are marked as pre-releases on GitHub, so the "Versi baru" check finds every final version

## [0.2.0] - 2026-11-03

Rantakit 0.2.0 for Windows and Linux: everything in 0.2.0-rc.1 and 0.2.0-rc.2, plus the changes below. Rantakit is in early development and is not stable yet.

### Changed

- Files chosen with "Buka" (Open) that no Tool can take now show why, with "Pilih file lain" (Choose other files) to pick again

## [0.2.0-rc.2] - 2026-11-02

Second release candidate for 0.2.0, for Windows and Linux, with a new window layout. Rantakit is in early development and is not stable yet.

### Added

- Rantakit's own title bar on Windows and Linux, with Back, Forward, and a button to hide the sidebar
- Back and Forward move between Home, History, and Tool pages, with Alt+← and Alt+→ or the mouse's side buttons; Ctrl+B hides or shows the sidebar
- "Buka" (Open) in the sidebar: choose photos or PDFs, then pick a Tool for them
- The window opens in the middle of the screen at 1100 × 720, and can't be made smaller than 800 × 560

### Changed

- The sidebar and the page are two cards on the window background
- Tool pages fill the window: the file list and the options scroll on their own, and the main button always stays in view; on phones it stays above the tab bar
- A smaller Tool page header, and Esc on a Tool page goes Back
- Thin scrollbars in the app's colors

### Removed

- The "⋯" menu in the sidebar. The license and source code links are in Settings, under "Tentang" (About)

### Fixed

- Settings no longer flickers when switching tabs
- The window no longer bounces when a touchpad swipe goes past the edge
- Sidebar items, Tool cards, and other buttons show their hover color again

## [0.2.0-rc.1] - 2026-11-02

Release candidate for 0.2.0, for Windows and Linux, to run the usability test with five people before the final release. Rantakit is in early development and is not stable yet.

### Added

- A new look: Home lists every Tool grouped by what you want to do, with "Terakhir dipakai" (Recent tools), search, and "Segera hadir" (Coming soon) cards
- Drop files anywhere to see the Tools that fit them
- One Tool page for every Tool: files on the left, options on the right, then progress with Cancel, then the Result with sizes before and after
- "Kompres Foto" (Compress Photo) and "Kompres PDF" (Compress PDF) fit a Size limit such as "maks 200 KB", or "Kecilkan saja" (just make it smaller) in three plain choices
- "Ubah Format Foto" (Convert Photo) turns photos into JPG or PNG, and leaves photos already in that format unchanged
- "Ubah Ukuran Foto" (Resize Photo) makes photos Besar, Sedang, or Kecil (large, medium, small), and never enlarges them
- The last five Size limits as quick choices
- Presets: save a Tool's options under a name and pick them again later
- "Pilihan lanjutan" (Advanced options) for quality, image size, and dpi, each with a plain explanation
- "Bagikan" (Share) for Results on Windows
- Settings for where Results are saved: next to the original, or in one folder you choose
- Interface in English, following the system language, with a choice in Settings
- Text size choice, and bundled Fredoka and Plus Jakarta Sans fonts

### Changed

- "Riwayat" (History) lists one entry per Task, grouped by day, keeps 30 days, and can be turned off in Settings
- Settings opens as a dialog in the main window instead of a separate window
- Result names say what was done, such as `ijazah (compressed).pdf`, and never replace an existing file
- Error messages say what to do next
- Colors meet WCAG AA contrast in light and dark themes

### Removed

- History from 0.1.0 is cleared on first launch, because its format changed. Result files stay where they are

## [0.1.0] - 2026-10-30

First public release, for Windows and Linux. Rantakit is in early development and is not stable yet.

### Added

- Image compression for JPG and PNG, by quality (1 to 100) or by a target file size per image
- Conversion between JPG and PNG
- Resizing images to a maximum longest side (4K, Full HD, …)
- EXIF orientation is applied, so rotated phone photos stay upright
- PDF compression: re-encodes JPEG photos inside the PDF, optionally downscales them, and removes unused objects. Text and vector graphics are left untouched
- Batch processing with per-file progress and results
- Drag and drop files onto the window, or pick them from the file dialog
- Results are saved next to the original as `name-rantakit.ext`, and existing files are never overwritten
- History of recent jobs, with a shortcut to open the containing folder
- Settings for theme (light, dark, system) and UI zoom
- Interface in Indonesian

[Unreleased]: https://github.com/moez-rd/rantakit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/moez-rd/rantakit/compare/v0.2.0-rc.2...v0.2.0
[0.2.0-rc.2]: https://github.com/moez-rd/rantakit/compare/v0.2.0-rc.1...v0.2.0-rc.2
[0.2.0-rc.1]: https://github.com/moez-rd/rantakit/compare/v0.1.0...v0.2.0-rc.1
[0.1.0]: https://github.com/moez-rd/rantakit/releases/tag/v0.1.0
