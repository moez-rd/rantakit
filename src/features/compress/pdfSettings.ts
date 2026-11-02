import { useStoredState } from "@/lib/storedState";
import { levelOf, limitBytes, parseShrink, type ShrinkSettings } from "./shrink";
import type { ToolOptions } from "./taskApi";

export const MAX_DIMENSIONS = [0, 3840, 2560, 1920, 1280];

export interface PdfSettings extends ShrinkSettings {
  /** Longest side of images inside the PDF; 0 keeps them as they are. */
  maxDimension: number;
}

function parse(stored: unknown): PdfSettings {
  const s = (stored ?? {}) as Partial<Record<keyof PdfSettings, unknown>>;
  return {
    ...parseShrink(stored),
    maxDimension: MAX_DIMENSIONS.includes(s.maxDimension as number) ? (s.maxDimension as number) : 0,
  };
}

/** Kompres PDF's options, remembered for the next visit. */
export function usePdfSettings() {
  return useStoredState("rantakit.kompresPdf", parse);
}

export function toPdfOptions(settings: PdfSettings): ToolOptions {
  return {
    tool: "kompres-pdf",
    limit: limitBytes(settings),
    level: levelOf(settings),
    maxDimension: settings.maxDimension || undefined,
  };
}
