# Rantakit architecture

This is the code map for Rantakit: which part owns what, the contract every engine follows, and which library or platform backend does each job. The product rules it serves live in [RANTAKIT.md](RANTAKIT.md), the order of work in [ROADMAP.md](ROADMAP.md), and the reasons behind the hard-to-reverse choices in the ADRs linked below.

Some of this is the target, not today's code. Today `crates/rantakit_core` holds both the image and PDF engines, and Result naming and History live in `src-tauri`. The v0.2 "Engine foundation" epic moves the code to the layout below; other engine crates are created when their release starts.

## Parts

| Part | Folder | Owns |
|---|---|---|
| `rantakit-image` | `crates/rantakit-image` | JPG and PNG, HEIC and WebP input, resize, watermark on photos, removing location and camera info |
| `rantakit-pdf` | `crates/rantakit-pdf` | Compress, merge, split, arrange pages, watermark on PDFs, render pages to JPG |
| `rantakit-office` | `crates/rantakit-office` | Compress Word, Excel, and PowerPoint files; Word and Excel to PDF |
| `rantakit-audio` | `crates/rantakit-audio` | Compress and convert audio |
| `rantakit-video` | `crates/rantakit-video` | Compress video |
| `rantakit-tasks` | `crates/rantakit-tasks` | The product rules shared by every platform (see below) |
| App shell | `src-tauri` | Turns frontend requests into Tasks; platform matters (file paths, share sheet, Result folder) |
| Frontend | `src` | One React app with a phone layout and a desktop layout; all words, icons, and error messages |

Every crate under `crates/` is free of Tauri ([ADR 0004](docs/adr/0004-engines-and-tasks-in-tauri-free-crates.md)). Crate names use kebab-case; Rust code imports them with underscores (`use rantakit_image::…`).

The app shell pulls in each engine crate through a cargo feature, so a platform build can leave a format family out. This is how the size gate in [RANTAKIT.md §7](RANTAKIT.md#app-size) is enforced.

## Engine contract

Every engine function follows the same shape:

- **File in, file out.** It reads one or more local input files and writes its Result to a local output path chosen by `rantakit-tasks`. Large inputs (video, audio, big PDFs) are streamed, never held whole in memory; image engines may load a whole photo internally.
- **Progress.** It reports progress through a callback, as a fraction or as "page *n* of *m*".
- **Cancel.** It checks a cancel token and stops promptly. A cancelled Task leaves no partial Result behind.
- **Error kinds, not messages.** It returns a typed error kind such as `PasswordProtected`, `Damaged`, `UnsupportedFormat`, `SizeLimitUnreachable { best }`, or `NotEnoughSpace`. The shell passes the kind to the frontend as a code, and the frontend turns it into an Indonesian or English message that says what to do next (RANTAKIT.md §6, principle 6).
- **File kinds from content.** Engines detect what a file is from its bytes, not its extension.

## `rantakit-tasks` and the shell

`rantakit-tasks` holds the rules that must behave the same on every platform:

- **Results:** names (`ijazah (compressed).pdf`, then `(2)` when the name is taken) and the rule that the Original is never modified, moved, or overwritten.
- **Tasks:** running a Tool over one or more files, with per-file progress and outcome.
- **History:** storage (one JSON file in the app data folder), 30-day retention, Hapus riwayat (Clear history), and the Simpan riwayat (Keep history) switch.
- **Size limits and Presets:** the last 5 Size limits and user-named Presets.
- **Tool catalogue facts:** each Tool's id, Job group, accepted file kinds, platforms, and whether it has shipped or is coming soon; and matching dropped or shared files to the Tools that fit them.

The shell stays thin. It deserializes requests, asks the platform where files are and where Results go, calls `rantakit-tasks`, and returns results and error codes. The frontend owns everything a user reads: Tool names and descriptions, icons, and messages, in both languages.

## Backends per format

A Tool keeps the same promise on every platform (same Tool, same output format, same quality bar), but its engine may use a different backend per platform ([ADR 0006](docs/adr/0006-per-platform-backends.md)). Every backend follows the dependency policy ([ADR 0005](docs/adr/0005-dependency-policy.md)).

| Format | Windows | Linux | Android |
|---|---|---|---|
| JPG and PNG, resize | `image` | `image` | `image` |
| PDF compress, merge, split, arrange | `lopdf` | `lopdf` | `lopdf` |
| HEIC input ([ADR 0007](docs/adr/0007-accept-hevc-patent-risk-for-heic-decoding.md)) | `heic` | `heic` | `heic` (the system decoder is the reserve if `heic` is too big) |
| WebP input (no WebP output) | `image-webp` | `image-webp` | `image-webp` |
| PDF to JPG | `hayro`, with `mupdf` as fallback | same | same |
| Compress office documents | `zip` plus `rantakit-image` | same | same |
| Audio in (.opus, .ogg, .m4a, .mp3, .wav) | `symphonia`, libopus for Opus | same | same |
| Audio out (MP3 only) | LAME | LAME | LAME |
| Video (H.264 in MP4 only, [ADR 0008](docs/adr/0008-h264-through-native-encoders-only.md)) | Media Foundation | System ffmpeg or GStreamer at runtime (to be confirmed by the size experiment) | MediaCodec and MediaMuxer through the NDK |
| Word and Excel to PDF | `office2pdf` with Carlito and Liberation fonts, labeled best effort | same | same |
| Scan Dokumen edge detection | | | `imageproc`, with draggable corners when detection misses |

Native Android backends are called from Rust through the NDK (`ndk` crate), so engine logic stays inside the engine crate. Kotlin is used only for app plumbing.

## Android

- **Receiving shares:** a small Kotlin plugin of our own registers for the share sheet (one or several files) and hands `content://` URIs to Rust.
- **Reading:** Rust opens those URIs through `tauri-plugin-fs`, which returns an ordinary `std::fs::File`.
- **Saving:** Results are written to `Download/Rantakit/` through `tauri-plugin-android-fs` (MediaStore on Android 10+).
- **Permissions:** `WRITE_EXTERNAL_STORAGE` is declared with `maxSdkVersion="28"`, so only Android 8 and 9 ask for it.
- **Builds:** one APK per ABI, arm64-v8a and armeabi-v7a.

## Size experiment

Before stories for the heavy formats are written, a throwaway `spike/size` branch adds each heavy format as a cargo feature on a minimal build of the current app. A GitHub Actions workflow builds the baseline and each format alone for Windows (installer), Linux (AppImage), and Android (arm64-v8a and armeabi-v7a APKs), and reports download size, plus installed size as a secondary number.

- **Budget:** one download-size cap per platform for the whole 1.0 app, set from the baseline.
- **Over budget:** formats leave 1.0 in this order until the app fits: Word and Excel to PDF, video, audio, PDF to JPG, office compression, HEIC.
- **Afterwards:** the measurements and the budget are recorded in an ADR, ROADMAP.md is updated, and the branch is deleted.

## Tests and CI

- Each engine crate and `rantakit-tasks` has Rust tests against fixtures.
- A CI workflow runs the Rust tests and the frontend type check on every push and pull request, on Windows and Linux.
- Native backends (MediaCodec, Media Foundation) are checked by hand on a real low-end Android phone and a Windows PC before each release.
- **Fixtures** committed to the repo are generated (like `crates/rantakit_core/examples/gen_fixtures.rs`) or openly licensed. Real documents (ID cards, diplomas, CVs, bank statements) are tested only from a local folder listed in `.gitignore`, never committed.
