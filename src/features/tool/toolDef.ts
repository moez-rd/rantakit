import type { ComponentType } from "react";
import type { ToolOptions } from "@/features/compress/taskApi";

export interface OptionsProps<S> {
  settings: S;
  onChange: (patch: Partial<S>) => void;
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
  toRequest: (settings: S) => ToolOptions;
}

export function defineTool<S extends object>(def: ToolDef<S>) {
  return def;
}
