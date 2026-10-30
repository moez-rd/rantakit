<div align="center">
  <img src="../../public/rantakit.svg" width="128" height="128" alt="Rantakit" />
  <h1>Rantakit</h1>

  <p><strong>Semua alat berkas, tanpa internet, gratis & open source.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue" alt="lisensi" />
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey" alt="platform" />
  </p>
</div>

<p align="center">
  <a href="../../README.md">English</a> |
  Bahasa Indonesia
</p>

---

Rantakit adalah kotak alat berkas yang gratis dan open source. Semua yang kamu butuhkan ada di satu tempat: kompres berkas, ubah format, olah PDF, pindai dokumen, dan ambil teks dari gambar.

Semua proses berjalan di perangkatmu, jadi aplikasi tetap berfungsi tanpa koneksi internet.

> [!WARNING]
> Rantakit masih dalam tahap awal pengembangan dan belum stabil. Fitur dan perilaku aplikasi bisa berubah sewaktu-waktu.

## Fitur

| Jenis                  | Status                | Jenis                          | Status         |
| ---------------------- | --------------------- | ------------------------------ | -------------- |
| Kompres gambar         | Pratinjau (JPG, PNG)  | Putar halaman PDF              | Belum tersedia |
| Kompres PDF            | Pratinjau             | Urutkan ulang halaman PDF      | Belum tersedia |
| Kompres GIF            | Belum tersedia        | Pindai dokumen                 | Belum tersedia |
| Kompres video          | Belum tersedia        | Ambil teks dari gambar         | Belum tersedia |
| Kompres audio          | Belum tersedia        | Proses banyak berkas sekaligus | Pratinjau      |
| Kompres dokumen Office | Belum tersedia        | Riwayat proses terbaru         | Pratinjau      |
| Konversi format gambar | Pratinjau (JPG ↔ PNG) | Dukungan Windows               | Pratinjau      |
| Gambar ke PDF          | Belum tersedia        | Dukungan macOS                 | Belum tersedia |
| PDF ke gambar          | Belum tersedia        | Dukungan Linux                 | Pratinjau      |
| Gabung PDF             | Belum tersedia        | Dukungan Android               | Belum tersedia |
| Pisah PDF              | Belum tersedia        | Dukungan iOS                   | Belum tersedia |
| Ambil halaman PDF      | Belum tersedia        |                                |                |

## Instalasi

Unduh versi terbaru dari [halaman Releases](https://github.com/moez-rd/rantakit/releases).

| OS | Berkas |
|---|---|
| Windows | `Rantakit_<versi>_x64-setup.exe` (atau `.msi`) |
| Debian, Ubuntu | `Rantakit_<versi>_amd64.deb` |
| Fedora, openSUSE | `Rantakit-<versi>-1.x86_64.rpm` |
| Distro Linux lain | `Rantakit_<versi>_amd64.AppImage` |

**Windows:** installer belum ditandatangani (*code signing*), jadi Windows SmartScreen mungkin menampilkan "Windows protected your PC". Klik **More info**, lalu **Run anyway**.

**Linux (.deb):** `sudo apt install ./Rantakit_<versi>_amd64.deb`

**Linux (AppImage):** jalankan `chmod +x` pada berkasnya, lalu buka. Di Ubuntu 22.04 ke atas, AppImage juga butuh `libfuse2` (`sudo apt install libfuse2`).

macOS belum ada rilis. Kamu juga bisa [build dari kode sumber](#build-dari-kode-sumber).

## Build dari kode sumber

**Prasyarat**

- Rust (stable), https://rustup.rs
- [Bun](https://bun.sh)
- Prasyarat Tauri untuk platformmu, https://tauri.app/start/prerequisites/

**Menjalankan**

```bash
bun install
bun run tauri dev       # pengembangan
bun run tauri build     # bundle produksi
```

**Pengecekan**

```bash
bun run build                         # cek tipe dan build frontend
cargo test --workspace                # tes Rust
cargo clippy --workspace --all-targets
```

## Struktur proyek

```
crates/rantakit_core/   mesin kompresi (gambar dan PDF), tanpa dependensi Tauri
src-tauri/               aplikasi desktop: command, riwayat, menu native
src/                     frontend React
```

## Teknologi

Tauri 2, Rust, [`image`](https://crates.io/crates/image), [`lopdf`](https://crates.io/crates/lopdf), React 19, TypeScript, Vite, Tailwind v4, React Aria Components.

## Berkontribusi

Issue dan pull request sangat diterima.

## Lisensi

Rantakit adalah perangkat lunak bebas yang dirilis di bawah [GNU Affero General Public License v3.0 atau versi yang lebih baru](../../LICENSE) (`AGPL-3.0-or-later`).
