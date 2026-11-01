import { FILE_KINDS, type FileKind } from "@/features/compress/fileKinds";
import type { Translator } from "@/i18n";
import { filesNoun, KIND_TOOLS, type DropMatch } from "./dropMatch";

interface DropState {
  /** A Task is running, so drops are ignored. */
  busy: boolean;
  /** The Tool page on screen, which takes dropped files directly; null on Home and History. */
  openKind: FileKind | null;
  /** Null while the dragged files are being checked. */
  match: DropMatch | null;
  count: number;
}

/** What the drop overlay says while files are dragged over the window. */
export function dropHint({ t, count }: Translator, { busy, openKind, match, count: n }: DropState) {
  if (busy) return { canDrop: false, title: t("drop.busy") };
  if (!match) return { canDrop: true, title: t("drop.here") };

  const files = count(`files.${filesNoun(match)}`, n);
  if (openKind) {
    const tool = KIND_TOOLS[openKind];
    if (match.status === "fits" && match.tools.includes(tool)) {
      return { canDrop: true, title: t("drop.addTo", { tool: t(`tool.${tool}`) }), detail: files };
    }
    if (match.status === "unsupported" || match.status === "fits") {
      return {
        canDrop: false,
        title: t("error.unsupported-format"),
        detail: t("error.accepted", { formats: FILE_KINDS[openKind].formats }),
      };
    }
  }

  switch (match.status) {
    case "fits":
      return { canDrop: true, title: t("drop.here"), detail: files };
    case "mixed":
      return { canDrop: false, title: t("drop.mixed"), detail: t("drop.mixed.hint") };
    case "unsupported":
      return { canDrop: false, title: t("drop.unsupported"), detail: t("drop.accepted") };
  }
}
