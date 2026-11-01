# Engines and product rules live in Tauri-free crates

Rantakit runs on Windows, Linux, and Android from one codebase, and its promises (the Original is never touched, Results are named the same way, History behaves the same) must hold on every platform. In v0.1.0 the engine lived in `rantakit_core`, but Result naming and History lived in the Tauri shell, where an Android port would have needed its own copy. We decided that file engines live in Tauri-free crates split by format family (`rantakit-image`, `rantakit-pdf`, `rantakit-office`, `rantakit-audio`, `rantakit-video`), not one crate per Tool, because Tools share engines (Kompres PDF and Gabung PDF both use the PDF engine). The product rules live in a separate Tauri-free crate, `rantakit-tasks`, and the Tauri shell only adapts requests and platform details to it.

## Consequences

- Each heavy dependency is isolated in one crate and pulled in through a cargo feature, so it can be measured, swapped, or left out of a platform build under the size gate.
- The product rules are tested without Tauri.
- All engines share one contract: file in and file out, progress, cancel, and typed error kinds that the frontend turns into messages.
