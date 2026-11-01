import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

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
