import { mockIPC } from "@tauri-apps/api/mocks";
import type { ToolInfo } from "@/features/home/tools";

/**
 * Stand-in backend for `bun run dev` in a plain browser, so screens can be
 * checked without the Tauri shell. Never part of a build. The Tools mirror
 * crates/rantakit-tasks/src/catalogue.rs on desktop.
 */
const TOOLS: ToolInfo[] = [
  { id: "kompres-foto", job: "kecilkan-ubah", comingSoon: false },
  { id: "kompres-pdf", job: "kecilkan-ubah", comingSoon: false },
  ...(
    [
      ["ubah-format-foto", "kecilkan-ubah"],
      ["ubah-ukuran-foto", "kecilkan-ubah"],
      ["kompres-dokumen", "kecilkan-ubah"],
      ["kompres-audio", "kecilkan-ubah"],
      ["ubah-format-audio", "kecilkan-ubah"],
      ["kompres-video", "kecilkan-ubah"],
      ["word-ke-pdf", "kecilkan-ubah"],
      ["excel-ke-pdf", "kecilkan-ubah"],
      ["jpg-ke-pdf", "scan"],
      ["gabung-pdf", "atur-pdf"],
      ["pisah-pdf", "atur-pdf"],
      ["atur-halaman-pdf", "atur-pdf"],
      ["pdf-ke-jpg", "atur-pdf"],
      ["beri-watermark", "bagikan-aman"],
      ["hapus-info-lokasi", "bagikan-aman"],
    ] as const
  ).map(([id, job]) => ({ id, job, comingSoon: true })),
];

export function installDevMocks() {
  mockIPC((cmd) => {
    switch (cmd) {
      case "list_tools":
        return TOOLS;
      case "list_history":
        return [];
      // Add ?recent to the URL to see Home after a few Tasks.
      case "recent_tools":
        return new URLSearchParams(location.search).has("recent") ? ["kompres-pdf", "kompres-foto"] : [];
      default:
        return null;
    }
  });
}
