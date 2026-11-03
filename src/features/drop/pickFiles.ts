import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { IMAGE_EXTENSIONS, withNames } from "@/features/compress/imageApi";
import { currentTranslator } from "@/i18n";

/**
 * Ask the user for any file a Tool can take, for the sidebar's "Buka" button.
 * The choice then goes the same way as a drop. Returns an empty list when
 * cancelled or outside Tauri.
 */
export async function pickAnyFiles(): Promise<string[]> {
  if (!isTauri()) return import.meta.env.DEV ? (await import("@/lib/devMocks")).devPick("photo") : [];

  const { t } = currentTranslator();
  const selected = await open({
    title: t("picker.files"),
    multiple: true,
    directory: false,
    filters: [{ name: t("picker.files.filter"), extensions: [...IMAGE_EXTENSIONS, "pdf"] }],
  });
  return withNames(selected ?? []);
}
