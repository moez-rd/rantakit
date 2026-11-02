import type { ComponentType } from "react";
import type { ToolOptions } from "@/features/compress/taskApi";
import type { FileInfo } from "./fileInfo";

export interface OptionsProps<S> {
  settings: S;
  onChange: (patch: Partial<S>) => void;
  /** What is known about the chosen files, in order; files not read yet are left out. */
  files: FileInfo[];
}

/** What makes one shipped Tool different on its page; the layout is the same for all. */
export interface ToolDef<S extends object> {
  /** How the Tool names its files: "3 foto", "Pilih foto"; "2 PDF", "Pilih PDF". */
  noun: "photo" | "pdf";
  pick: () => Promise<string[]>;
  /** The Tool's options, remembered between visits. */
  useSettings: () => readonly [S, (patch: Partial<S>) => void];
  /** Options always shown. */
  Main: ComponentType<OptionsProps<S>>;
  /** Options under "Pilihan lanjutan". */
  Advanced?: ComponentType<OptionsProps<S>>;
  /** Whether "Pilihan lanjutan" applies to the current choice; always, when left out. */
  showAdvanced?: (settings: S, files: FileInfo[]) => boolean;
  toRequest: (settings: S, files: FileInfo[]) => ToolOptions;
  /**
   * Whether `options` would leave this file as it is, like a JPG for "Ubah ke
   * JPG". Its row says so before the Task starts.
   */
  leavesUnchanged?: (options: ToolOptions, file: FileInfo) => boolean;
}

export function defineTool<S extends object>(def: ToolDef<S>) {
  return def;
}
