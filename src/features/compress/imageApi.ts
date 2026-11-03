import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { currentTranslator } from "@/i18n";
import { isAndroidApp } from "@/lib/platform";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

/** Names of files chosen on Android, by their `content://` address. */
const chosenNames = new Map<string, string>();

/** A file's name: the last segment of a Windows or POSIX path, or the name Android gave a chosen file. */
export const fileName = (path: string) => chosenNames.get(path) ?? path.split(/[\\/]/).pop() ?? path;

/**
 * Looks up the names of files chosen on Android, whose `content://`
 * addresses do not contain them, so that `fileName` can show them.
 */
export async function withNames(paths: string[]): Promise<string[]> {
  if (!isAndroidApp || paths.length === 0) return paths;
  const names = await invoke<(string | null)[]>("file_names", { paths }).catch(() => []);
  paths.forEach((path, i) => names[i] && chosenNames.set(path, names[i]));
  return paths;
}

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
  return withNames(selected ?? []);
}
