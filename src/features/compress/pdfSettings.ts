import { isInt, useStoredState } from "@/lib/storedState";
import { MAX_DIMENSIONS } from "./imageSettings";
import type { PdfRequest } from "./pdfApi";

export interface PdfSettings {
  /** JPEG quality for images inside the PDF, 1–100. */
  quality: number;
  /** Longest side of images inside the PDF; 0 keeps them as they are. */
  maxDimension: number;
}

const DEFAULTS: PdfSettings = { quality: 70, maxDimension: 0 };

function parse(stored: unknown): PdfSettings {
  const s = (stored ?? {}) as Partial<Record<keyof PdfSettings, unknown>>;
  return {
    quality: isInt(s.quality, 1, 100) ? s.quality : DEFAULTS.quality,
    maxDimension: MAX_DIMENSIONS.includes(s.maxDimension as number)
      ? (s.maxDimension as number)
      : DEFAULTS.maxDimension,
  };
}

/** PDF settings that are remembered for the next batch. */
export function usePdfSettings() {
  return useStoredState("rantakit.pdfSettings", parse);
}

export function toPdfRequest(path: string, settings: PdfSettings): PdfRequest {
  return {
    path,
    quality: settings.quality,
    maxDimension: settings.maxDimension || undefined,
  };
}
