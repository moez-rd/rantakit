# Changelog

All notable changes to Rantakit are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/moez-rd/rantakit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/moez-rd/rantakit/releases/tag/v0.1.0
