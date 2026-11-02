# Changelog

All notable changes to Rantakit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/moez-rd/rantakit/compare/v0.2.0-rc.1...HEAD
[0.2.0-rc.1]: https://github.com/moez-rd/rantakit/compare/v0.1.0...v0.2.0-rc.1
[0.1.0]: https://github.com/moez-rd/rantakit/releases/tag/v0.1.0
