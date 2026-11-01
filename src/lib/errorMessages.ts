import type { MessageKey, Translator } from "@/i18n";
import { formatBytes } from "./format";

/** Every code the backend sends; each has an "error.<code>" string in both languages. */
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

const CODES: ErrorCode[] = [
  "password-protected",
  "damaged",
  "unsupported-format",
  "size-limit-unreachable",
  "not-enough-space",
  "cannot-write",
  "original-missing",
  "cancelled",
  "history-from-newer-version",
  "unexpected",
];

/** What to tell the user about an error from the backend: `{ code, best? }`, or anything else. */
export function errorMessage({ t, locale }: Translator, error: unknown): string {
  const { code, best } = (error ?? {}) as { code?: unknown; best?: unknown };
  const known = CODES.find((c) => c === code) ?? "unexpected";
  switch (known) {
    case "size-limit-unreachable":
      return typeof best === "number"
        ? t("error.size-limit-unreachable", { best: formatBytes(best, locale) })
        : t("error.size-limit-unreachable.unknown");
    case "cancelled":
      return t("task.file.cancelled");
    default:
      return t(`error.${known}` satisfies MessageKey);
  }
}
