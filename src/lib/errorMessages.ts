import { formatBytes } from "./format";

/** Every code the backend sends; a missing message fails the type check. */
type ErrorCode =
  | "password-protected"
  | "damaged"
  | "unsupported-format"
  | "size-limit-unreachable"
  | "not-enough-space"
  | "cannot-write"
  | "original-missing"
  | "cancelled"
  | "history-from-newer-version"
  | "unexpected";

const MESSAGES: Record<ErrorCode, (best?: number) => string> = {
  "password-protected": () => "PDF ini dikunci dengan kata sandi. Buka kuncinya dulu, lalu coba lagi.",
  damaged: () => "File ini rusak atau tidak lengkap. Coba unduh atau salin ulang filenya.",
  "unsupported-format": () => "Alat ini belum bisa membuka file jenis ini.",
  "size-limit-unreachable": (best) =>
    best === undefined ? "Batas ukuran tidak tercapai." : `Paling kecil bisa ${formatBytes(best)}.`,
  "not-enough-space": () => "Ruang penyimpanan penuh. Kosongkan sedikit ruang, lalu coba lagi.",
  "cannot-write": () => "Hasil tidak bisa disimpan di folder ini. Pilih folder lain di Pengaturan.",
  "original-missing": () => "File aslinya sudah dipindah atau dihapus.",
  cancelled: () => "Dibatalkan",
  "history-from-newer-version": () =>
    "Riwayat ini dibuat oleh Rantakit versi lebih baru. Perbarui Rantakit untuk membukanya.",
  unexpected: () => "Ada yang tidak beres. Coba lagi.",
};

/** What to tell the user about an error from the backend: `{ code, best? }`, or anything else. */
export function errorMessage(error: unknown): string {
  const { code, best } = (error ?? {}) as { code?: unknown; best?: unknown };
  const message = typeof code === "string" && code in MESSAGES ? MESSAGES[code as ErrorCode] : MESSAGES.unexpected;
  return message(typeof best === "number" ? best : undefined);
}
