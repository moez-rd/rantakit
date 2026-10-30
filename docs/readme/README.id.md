<div align="center">
  <img src="../../public/rantakit.svg" width="128" height="128" alt="Rantakit" />
  <h1>Rantakit</h1>

  <p><strong>Kompres berkasmu langsung di perangkatmu. Tanpa unggah, tanpa internet, tanpa beban.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue" alt="lisensi" />
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="platform" />
  </p>
</div>

<p align="center">
  <a href="../../README.md">English</a> |
  Bahasa Indonesia
</p>

---

Rantakit adalah aplikasi desktop open source untuk mengompres gambar dan PDF, dibangun dengan Tauri 2, Rust, dan React 19. Semua proses berjalan secara lokal: berkas tidak pernah meninggalkan perangkatmu, dan aplikasi tetap berfungsi tanpa koneksi internet. Tanpa akun, tanpa telemetri.

## Fitur

| Jenis | Format | Status |
|---|---|---|
| Gambar | JPG, PNG | Pratinjau |
| PDF | PDF | Pratinjau |
| Video | | Belum tersedia |
| Audio | | Belum tersedia |
| Dokumen Office | | Belum tersedia |
| GIF | GIF | Belum tersedia |
| Berkas web | HTML, CSS, JS, SVG | Belum tersedia |

### Gambar

- Input **JPG dan PNG**
- **Kualitas atau ukuran target:** pilih kualitas dari 1 sampai 100, atau tentukan ukuran maksimal per gambar dan biarkan Rantakit mencari kualitas terbaik yang muat
- **Konversi** antara JPG dan PNG
- **Perkecil** sampai batas sisi terpanjang (4K, Full HD, …)
- **Orientasi EXIF** diterapkan, jadi foto ponsel yang diputar tetap tegak

### PDF

- **Mengompres ulang foto JPEG** di dalam PDF, dan bisa sekaligus memperkecilnya
- **Merapikan** objek yang tidak terpakai dan menyimpan struktur berkas yang lebih ringkas
- Teks dan grafik vektor tidak diubah

### Aplikasi

- Kompres **banyak berkas sekaligus**, dengan progres dan hasil per berkas
- **Seret dan lepas** berkas ke jendela aplikasi, atau pilih lewat dialog berkas bawaan sistem
- **Tidak pernah menimpa:** hasil disimpan di sebelah berkas asli sebagai `nama-dikompres.ext`
- **Riwayat** kompresi terbaru, dengan pintasan untuk membuka foldernya
- **Pengaturan** tema (terang, gelap, sistem), ukuran tampilan, dan bahasa

## Instalasi

Belum ada rilis. Untuk sementara, [build dari kode sumber](#build-dari-kode-sumber).

## Build dari kode sumber

**Prasyarat**

- Rust (stable), https://rustup.rs
- [Bun](https://bun.sh)
- Prasyarat Tauri untuk platformmu, https://tauri.app/start/prerequisites/

**Menjalankan**

```bash
bun install
bun run tauri dev       # pengembangan
bun run tauri build     # bundle produksi, ditulis ke target/release/bundle/
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
