import type { ComponentType } from "react";
import { File, Image, type IconProps } from "@keyline-icons/react";
import { pickImages } from "./imageApi";
import { pickPdfs } from "./pdfApi";

/** What a batch compresses. One batch holds one kind. */
export type FileKind = "image" | "pdf";

interface KindInfo {
  /** Count of files of this kind: "3 foto", "3 PDF". */
  files: "files.photo" | "files.pdf";
  icon: ComponentType<IconProps>;
  /** The formats this kind opens, as the user knows them. */
  formats: string;
  pick: () => Promise<string[]>;
}

export const FILE_KINDS: Record<FileKind, KindInfo> = {
  image: { files: "files.photo", icon: Image, formats: "JPG, PNG", pick: pickImages },
  pdf: { files: "files.pdf", icon: File, formats: "PDF", pick: pickPdfs },
};

