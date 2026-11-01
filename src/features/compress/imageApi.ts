import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { currentTranslator } from "@/i18n";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

/** Last segment of a Windows or POSIX path. */
export const fileName = (path: string) => path.split(/[\\/]/).pop() ?? path;

/** Ask the user for photos. Returns an empty list when cancelled or outside Tauri. */
export async function pickImages(): Promise<string[]> {
  if (!isTauri()) return import.meta.env.DEV ? (await import("@/lib/devMocks")).devPick("photo") : [];

  const { t } = currentTranslator();
  const selected = await open({
    title: t("picker.photos"),
    multiple: true,
    directory: false,
    filters: [{ name: t("picker.photos.filter"), extensions: IMAGE_EXTENSIONS }],
  });
  return selected ?? [];
}
