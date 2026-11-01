# Dependencies build from source, with native OS backends allowed

Rantakit must be small, inspectable, and acceptable to stores that build from source, such as F-Droid and Flathub, even though which stores we use is not decided yet. Changing a library after features depend on it is expensive, so we decided the rule now. Pure Rust dependencies are preferred. C and C++ dependencies are allowed only when they build from source through cargo for Windows, Linux, and the Android NDK. No prebuilt binaries, proprietary code, or licenses incompatible with AGPL-3.0-or-later are allowed. Platform-native codecs and services (for example Android MediaCodec or Windows Media Foundation) are allowed, because they add no size, as long as the Tool keeps the same promise on every platform ([ADR 0006](0006-per-platform-backends.md)).

## Consequences

- Pdfium is ruled out, because its Rust bindings depend on prebuilt binaries.
- Proprietary services such as Google ML Kit are ruled out, even where they would be easier.
- Bundling a large codec library such as ffmpeg must still pass the size gate.
