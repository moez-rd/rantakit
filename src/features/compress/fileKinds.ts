import { FileText, Image, type LucideIcon } from "lucide-react";
import { isImagePath, pickImages } from "./imageApi";
import { isPdfPath, pickPdfs } from "./pdfApi";

/** What a batch compresses. One batch holds one kind. */
export type FileKind = "image" | "pdf";

interface KindInfo {
  /** Noun for counts in the UI: "3 gambar", "3 PDF". */
  noun: string;
  icon: LucideIcon;
  matches: (path: string) => boolean;
  pick: () => Promise<string[]>;
}

export const FILE_KINDS: Record<FileKind, KindInfo> = {
  image: { noun: "gambar", icon: Image, matches: isImagePath, pick: pickImages },
  pdf: { noun: "PDF", icon: FileText, matches: isPdfPath, pick: pickPdfs },
};

export interface DropPlan {
  kind: FileKind | null;
  paths: string[];
  skipped: number;
}

/**
 * Which dropped files to take. A drop joins the current batch's kind when it can;
 * otherwise images win over PDFs. Everything else is skipped.
 */
export function planDrop(paths: string[], current: FileKind | null): DropPlan {
  const byKind = (kind: FileKind) => paths.filter(FILE_KINDS[kind].matches);
  const images = byKind("image");
  const pdfs = byKind("pdf");

  let kind: FileKind | null = null;
  if (current && byKind(current).length > 0) kind = current;
  else if (images.length > 0) kind = "image";
  else if (pdfs.length > 0) kind = "pdf";

  const taken = kind === "image" ? images : kind === "pdf" ? pdfs : [];
  return { kind, paths: taken, skipped: paths.length - taken.length };
}
