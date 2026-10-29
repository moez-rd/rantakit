import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/** Mirrors `ImageRequest` in `src-tauri/src/commands/image.rs`. */
export interface ImageRequest {
  path: string;
  /** Output format; omit to keep the input format. */
  format?: "jpeg" | "png";
  /** 1–100, defaults to 80 on the Rust side. */
  quality?: number;
  /** Aim for this size instead of a fixed quality. */
  maxBytes?: number;
  maxDimension?: number;
}

/** Mirrors `ImageResult` in `src-tauri/src/commands/image.rs`. */
export interface ImageResult {
  inputPath: string;
  outputPath: string;
  format: "jpeg" | "png";
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  quality: number | null;
}

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

export const isImagePath = (path: string) =>
  IMAGE_EXTENSIONS.includes(path.split(".").pop()?.toLowerCase() ?? "");

/** Last segment of a Windows or POSIX path. */
export const fileName = (path: string) => path.split(/[\\/]/).pop() ?? path;

/** Ask the user for images. Returns an empty list when cancelled or outside Tauri. */
export async function pickImages(): Promise<string[]> {
  if (!isTauri()) return [];

  const selected = await open({
    title: "Pilih gambar",
    multiple: true,
    directory: false,
    filters: [{ name: "Gambar", extensions: IMAGE_EXTENSIONS }],
  });
  return selected ?? [];
}

/** Compress one image; the copy is saved next to the original. Rejects with an error message. */
export function compressImage(request: ImageRequest) {
  return invoke<ImageResult>("compress_image", { request });
}
