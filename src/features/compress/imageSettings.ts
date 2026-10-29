import { isInt, useStoredState } from "@/lib/storedState";
import type { ImageRequest } from "./imageApi";

export type SizeMode = "quality" | "target";
export type OutputFormat = "same" | "jpeg" | "png";

export interface ImageSettings {
  mode: SizeMode;
  /** 1–100, used when `mode` is "quality". */
  quality: number;
  /** Per-image size limit in KB, used when `mode` is "target". */
  targetKb: number;
  format: OutputFormat;
  /** Longest side in pixels; 0 keeps the original size. */
  maxDimension: number;
}

export const MAX_DIMENSIONS = [0, 3840, 2560, 1920, 1280];

const DEFAULTS: ImageSettings = {
  mode: "quality",
  quality: 80,
  targetKb: 500,
  format: "same",
  maxDimension: 0,
};

/** Falls back to the defaults for anything missing or invalid. */
function parse(stored: unknown): ImageSettings {
  const s = (stored ?? {}) as Partial<Record<keyof ImageSettings, unknown>>;
  return {
    mode: s.mode === "target" ? "target" : DEFAULTS.mode,
    quality: isInt(s.quality, 1, 100) ? s.quality : DEFAULTS.quality,
    targetKb: isInt(s.targetKb, 1, 1_000_000) ? s.targetKb : DEFAULTS.targetKb,
    format: s.format === "jpeg" || s.format === "png" ? s.format : DEFAULTS.format,
    maxDimension: MAX_DIMENSIONS.includes(s.maxDimension as number)
      ? (s.maxDimension as number)
      : DEFAULTS.maxDimension,
  };
}

/** Image settings that are remembered for the next batch. */
export function useImageSettings() {
  return useStoredState("dikompres.imageSettings", parse);
}

export function toImageRequest(path: string, settings: ImageSettings): ImageRequest {
  return {
    path,
    format: settings.format === "same" ? undefined : settings.format,
    quality: settings.quality,
    maxBytes: settings.mode === "target" ? settings.targetKb * 1024 : undefined,
    maxDimension: settings.maxDimension || undefined,
  };
}
