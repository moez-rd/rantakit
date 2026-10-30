<div align="center">
  <img src="public/rantakit.svg" width="128" height="128" alt="Rantakit" />
  <h1>Rantakit</h1>

  <p><strong>All your file tools, no internet needed, free & open source.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue" alt="license" />
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey" alt="platform" />
  </p>
</div>

<p align="center">
  English |
  <a href="docs/readme/README.id.md">Bahasa Indonesia</a>
</p>

---

Rantakit is free, open source file toolkit, it keeps everything you need in one place: compress files, convert formats, work in PDFs, scan documents, and extract text out of images.

Everything runs on your device. That means it works with no internet connection.

> [!WARNING]
> Rantakit is in early development and is not stable yet. Features and behavior may change at any time.

## Features

| Type                     | Status              | Type                     | Status              |
| ------------------------ | ------------------- | ------------------------ | ------------------- |
| Compress image           | Preview (JPG, PNG)  | Rotate PDF pages         | Not implemented yet |
| Compress PDF             | Preview             | Reorder PDF pages        | Not implemented yet |
| Compress GIF             | Not implemented yet | Capture documents        | Not implemented yet |
| Compress video           | Not implemented yet | Extract text from images | Not implemented yet |
| Compress audio           | Not implemented yet | Batch processing         | Preview             |
| Compress office document | Not implemented yet | History of recent jobs   | Preview             |
| Image format conversions | Preview (JPG ↔ PNG) | Windows support          | Preview             |
| Images to PDF            | Not implemented yet | macOS support            | Not implemented yet |
| PDF to images            | Not implemented yet | Linux support            | Preview             |
| Merge PDFs               | Not implemented yet | Android support          | Not implemented yet |
| Split PDFs               | Not implemented yet | iOS support              | Not implemented yet |
| Extract PDF pages        | Not implemented yet |                          |                     |


## Install

Download the latest version from the [Releases page](https://github.com/moez-rd/rantakit/releases).

| OS | File |
|---|---|
| Windows | `Rantakit_<version>_x64-setup.exe` (or the `.msi`) |
| Debian, Ubuntu | `Rantakit_<version>_amd64.deb` |
| Fedora, openSUSE | `Rantakit-<version>-1.x86_64.rpm` |
| Other Linux distros | `Rantakit_<version>_amd64.AppImage` |

**Windows:** the installer is not code-signed yet, so Windows SmartScreen may show "Windows protected your PC". Click **More info**, then **Run anyway**.

**Linux (.deb):** `sudo apt install ./Rantakit_<version>_amd64.deb`

**Linux (AppImage):** run `chmod +x` on the file, then open it. On Ubuntu 22.04 and newer, AppImages also need `libfuse2` (`sudo apt install libfuse2`).

macOS has not have release yet. You can also [build from source](#build-from-source).

## Build from source

**Prerequisites**

- Rust (stable), https://rustup.rs
- [Bun](https://bun.sh)
- Tauri prerequisites for your platform, https://tauri.app/start/prerequisites/

**Run**

```bash
bun install
bun run tauri dev       # development
bun run tauri build     # production bundle
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
