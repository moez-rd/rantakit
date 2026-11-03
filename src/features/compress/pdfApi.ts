import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { currentTranslator } from "@/i18n";
import { withNames } from "./imageApi";

/** Ask the user for PDFs. Returns an empty list when cancelled or outside Tauri. */
export async function pickPdfs(): Promise<string[]> {
  if (!isTauri()) return import.meta.env.DEV ? (await import("@/lib/devMocks")).devPick("pdf") : [];

  const selected = await open({
    title: currentTranslator().t("picker.pdfs"),
    multiple: true,
    directory: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  return withNames(selected ?? []);
}
