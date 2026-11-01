# H.264 video only through native encoders

Compressed videos must be H.264 in MP4, because that is what WhatsApp and portals accept. Bundling an H.264 encoder does not work for Rantakit: ffmpeg is far too big for the size budget, and Cisco's patent coverage for openh264 applies only to Cisco's own binary, not to the build from source that our dependency policy requires ([ADR 0005](0005-dependency-policy.md)). We decided that H.264 is encoded only through encoders the platform already provides: MediaCodec on Android, Media Foundation on Windows, and the system's own ffmpeg or GStreamer on Linux. The device or operating system then carries the patent licence, and the app grows by almost nothing.

## Consequences

- Linux is the weak spot. If the size experiment shows that no system encoder is reliably available there, including in the Flatpak runtime, compressing video moves to after 1.0 rather than shipping on only some platforms ([ADR 0006](0006-per-platform-backends.md)).
- Speed depends on the device's hardware encoder and is measured on a ~3 GB RAM Android phone.
