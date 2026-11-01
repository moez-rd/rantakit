import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

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
