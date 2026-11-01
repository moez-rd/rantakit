# One Tool, different backends per platform

Some formats, video above all, can only fit the app-size budget by using the encoders the operating system already has: MediaCodec on Android and Media Foundation on Windows. A bundled encoder would cost many megabytes, and for H.264 it would also bring patent obligations. We decided that an engine crate may choose a different backend on each platform behind one interface. What stays the same everywhere is the promise to the user: the same Tool, the same output format, and the same quality bar. The bytes of the Result may differ between platforms.

## Consequences

- Tests check the promise (format, Size limit met, file opens) rather than exact output bytes.
- Native Android backends are called from Rust through the NDK, so engine logic stays in the engine crate rather than in Kotlin or the Tauri shell.
- If a platform has no backend that fits the budget, that Tool moves to after 1.0 rather than shipping on only some platforms.
- Native backends need manual checks on real devices before each release, because CI and emulators cover them poorly.
