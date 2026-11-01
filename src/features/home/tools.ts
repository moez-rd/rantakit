import { useEffect, useState, type ComponentType } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { IconProps } from "@keyline-icons/react";
import {
  ArrowLeftRight,
  AudioLines,
  FileArrowDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileZip,
  Film,
  Grid2x2,
  ImageArrowDown,
  Images,
  Layers,
  MapPinOff,
  Maximize2,
  MusicNote,
  ScanText,
  Split,
  Stamp,
} from "@keyline-icons/react/two-tone";

/** The ids in crates/rantakit-tasks/src/catalogue.rs (`ToolId::as_str`). */
export type ToolId =
  | "kompres-foto"
  | "kompres-pdf"
  | "ubah-format-foto"
  | "ubah-ukuran-foto"
  | "kompres-dokumen"
  | "kompres-audio"
  | "ubah-format-audio"
  | "kompres-video"
  | "word-ke-pdf"
  | "excel-ke-pdf"
  | "jpg-ke-pdf"
  | "scan-dokumen"
  | "gabung-pdf"
  | "pisah-pdf"
  | "atur-halaman-pdf"
  | "pdf-ke-jpg"
  | "beri-watermark"
  | "hapus-info-lokasi";

/** The Jobs, in the order Home shows them (`Job::as_str`). */
export const JOBS = ["kecilkan-ubah", "scan", "atur-pdf", "ambil-teks", "bagikan-aman"] as const;
export type JobId = (typeof JOBS)[number];

/** A Tool listed on this platform, in catalogue order. */
export interface ToolInfo {
  id: ToolId;
  job: JobId;
  comingSoon: boolean;
}

export const TOOL_ICONS: Record<ToolId, ComponentType<IconProps>> = {
  "kompres-foto": ImageArrowDown,
  "kompres-pdf": FileArrowDown,
  "ubah-format-foto": ArrowLeftRight,
  "ubah-ukuran-foto": Maximize2,
  "kompres-dokumen": FileZip,
  "kompres-audio": AudioLines,
  "ubah-format-audio": MusicNote,
  "kompres-video": Film,
  "word-ke-pdf": FileText,
  "excel-ke-pdf": FileSpreadsheet,
  "jpg-ke-pdf": Images,
  "scan-dokumen": ScanText,
  "gabung-pdf": Layers,
  "pisah-pdf": Split,
  "atur-halaman-pdf": Grid2x2,
  "pdf-ke-jpg": FileImage,
  "beri-watermark": Stamp,
  "hapus-info-lokasi": MapPinOff,
};

/** The last Tools used, newest first; empty until the first Task finishes. */
export function useRecentTools(): string[] {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    invoke<string[]>("recent_tools")
      .then(setRecent)
      .catch(() => {});
  }, []);
  return recent;
}

/** The Tools to list on this platform; empty until the backend answers. */
export function useTools(): ToolInfo[] {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  useEffect(() => {
    invoke<ToolInfo[]>("list_tools")
      .then(setTools)
      .catch(() => {});
  }, []);
  return tools;
}
