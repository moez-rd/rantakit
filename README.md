<div align="center">
  <img src="public/rantakit.svg" width="128" height="128" alt="Rantakit" />
  <h1>Rantakit</h1>

  <p><strong>Compress your files on your device. No uploads, no internet, no bloat.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue" alt="license" />
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="platform" />
  </p>
</div>

<p align="center">
  English |
  <a href="docs/readme/README.id.md">Bahasa Indonesia</a>
</p>

---

Rantakit is an open-source desktop app for compressing images and PDFs, built with Tauri 2, Rust and React 19. Everything runs locally: files never leave your device, and the app works without an internet connection. No account, no telemetry.

## Features

| Type | Formats | Status |
|---|---|---|
| Image | JPG, PNG | Preview |
| PDF | PDF | Preview |
| Video | | Not implemented yet |
| Audio | | Not implemented yet |
| Office document | | Not implemented yet |
| GIF | GIF | Not implemented yet |
| Web file | HTML, CSS, JS, SVG | Not implemented yet |

### Images

- **JPG and PNG** input
- **Quality or target size:** pick a quality from 1 to 100, or set a maximum size per image and let Rantakit find the best quality that fits
- **Convert** between JPG and PNG
- **Resize** to a maximum longest side (4K, Full HD, …)
- **EXIF orientation** is applied, so rotated phone photos stay upright

### PDF

- **Re-encodes JPEG photos** inside the PDF and optionally downscales them
- **Cleans up** unused objects and writes a more compact file structure
- Text and vector graphics are left untouched

### App

- **Batch** compression with per-file progress and results
- **Drag and drop** files onto the window, or pick them from the native file dialog
- **Never overwrites:** results are saved next to the original as `name-dikompres.ext`
- **History** of recent compressions, with a shortcut to open the containing folder
- **Settings** for theme (light, dark, system), UI zoom and language

## Install

There is no release yet. For now, [build from source](#build-from-source).

## Build from source

**Prerequisites**

- Rust (stable), https://rustup.rs
- [Bun](https://bun.sh)
- Tauri prerequisites for your platform, https://tauri.app/start/prerequisites/

**Run**

```bash
bun install
bun run tauri dev       # development
bun run tauri build     # production bundle, written to target/release/bundle/
```

**Checks**

```bash
bun run build                         # type-check and build the frontend
cargo test --workspace                # Rust tests
cargo clippy --workspace --all-targets
```

## Project structure

```
crates/rantakit_core/   compression engine (images and PDF), no Tauri dependency
src-tauri/               desktop app: commands, history, native menu
src/                     React frontend
```

## Tech stack

Tauri 2, Rust, [`image`](https://crates.io/crates/image), [`lopdf`](https://crates.io/crates/lopdf), React 19, TypeScript, Vite, Tailwind v4, React Aria Components.

## Contributing

Issues and pull requests are welcome.

## License

Rantakit is free software, licensed under the [GNU Affero General Public License v3.0 or later](LICENSE) (`AGPL-3.0-or-later`).
