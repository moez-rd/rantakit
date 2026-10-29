import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/** Mirrors `PdfRequest` in `src-tauri/src/commands/pdf.rs`. */
export interface PdfRequest {
  path: string;
  /** JPEG quality for images inside the PDF, 1–100; defaults to 70 on the Rust side. */
  quality?: number;
  maxDimension?: number;
}

/** Mirrors `PdfResult` in `src-tauri/src/commands/pdf.rs`. */
export interface PdfResult {
  inputPath: string;
  outputPath: string;
  format: "pdf";
  originalBytes: number;
  compressedBytes: number;
  images: number;
  imagesRecompressed: number;
}

export const isPdfPath = (path: string) => path.toLowerCase().endsWith(".pdf");

/** Ask the user for PDFs. Returns an empty list when cancelled or outside Tauri. */
export async function pickPdfs(): Promise<string[]> {
  if (!isTauri()) return [];

  const selected = await open({
    title: "Pilih PDF",
    multiple: true,
    directory: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  return selected ?? [];
}

/** Compress one PDF; the copy is saved next to the original. Rejects with an error message. */
export function compressPdf(request: PdfRequest) {
  return invoke<PdfResult>("compress_pdf", { request });
}
