import { useMemo, useSyncExternalStore } from "react";
import { loadPreferences, subscribePreferences } from "@/features/settings/preferences";
import { en } from "./en";
import { id } from "./id";

export type Language = "id" | "en";

/** Every string key. `id.ts` defines them; `en.ts` must have exactly the same ones. */
export type MessageKey = keyof typeof id;
export type Messages = Record<MessageKey, string>;

const DICTIONARIES: Record<Language, Messages> = { id, en };

/** The names inside `{…}` in a string type: "Kompres {files}" → "files". */
type Placeholders<S> = S extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never;

/** A key with placeholders takes a value for each one; a key without takes none. */
type Params<K extends MessageKey> = [Placeholders<(typeof id)[K]>] extends [never]
  ? []
  : [params: Record<Placeholders<(typeof id)[K]>, string | number>];

/** Keys that come in a ".one" and ".other" form, for counts. */
type CountKey = {
  [K in MessageKey]: K extends `${infer Base}.one` ? (`${Base}.other` extends MessageKey ? Base : never) : never;
}[MessageKey];

export interface Translator {
  language: Language;
  /** BCP 47 tag for number and date formatting. */
  locale: string;
  t: <K extends MessageKey>(key: K, ...params: Params<K>) => string;
  /** "{count} foto" or "1 photo" / "3 photos": picks ".one" or ".other" by `count`. */
  count: (key: CountKey, count: number) => string;
}

function fill(text: string, params?: Record<string, string | number>) {
  return params ? text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match)) : text;
}

export function translator(language: Language): Translator {
  const messages = DICTIONARIES[language];
  return {
    language,
    locale: language === "id" ? "id-ID" : "en",
    t: (key, ...[params]) => fill(messages[key], params as Record<string, string | number> | undefined),
    count: (key, count) => fill(messages[`${key}.${count === 1 ? "one" : "other"}` as MessageKey], { count }),
  };
}

/** The language the UI shows right now. */
export function currentLanguage(): Language {
  return loadPreferences().language;
}

/** For code outside React (dialog titles, window titles). Components use `useT`. */
export function currentTranslator() {
  return translator(currentLanguage());
}

/** The translator for the current language; re-renders when the language changes. */
export function useT(): Translator {
  const language = useSyncExternalStore(subscribePreferences, currentLanguage);
  return useMemo(() => translator(language), [language]);
}
