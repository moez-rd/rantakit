import { useStoredState } from "@/lib/storedState";
import { levelOf, limitBytes, parseShrink, type ShrinkSettings } from "./shrink";
import type { ToolOptions } from "./taskApi";

export type OutputFormat = "same" | "jpeg" | "png";

export interface ImageSettings extends ShrinkSettings {
  format: OutputFormat;
  /** Longest side in pixels; 0 keeps the original size. */
  maxDimension: number;
}

export const MAX_DIMENSIONS = [0, 3840, 2560, 1920, 1280];

/** Falls back to the defaults for anything missing or invalid. */
function parse(stored: unknown): ImageSettings {
  const s = (stored ?? {}) as Partial<Record<keyof ImageSettings, unknown>>;
  return {
    ...parseShrink(stored),
    format: s.format === "jpeg" || s.format === "png" ? s.format : "same",
    maxDimension: MAX_DIMENSIONS.includes(s.maxDimension as number) ? (s.maxDimension as number) : 0,
  };
}

/** Kompres Foto's options, remembered for the next visit. */
export function useImageSettings() {
  return useStoredState("rantakit.kompresFoto", parse);
}

export function toImageOptions(settings: ImageSettings): ToolOptions {
  return {
    tool: "kompres-foto",
    format: settings.format === "same" ? undefined : settings.format,
    limit: limitBytes(settings),
    level: levelOf(settings),
    maxDimension: settings.maxDimension || undefined,
  };
}

/** Longest sides tried, in order, when a Size limit can't be reached. */
const SHRINK_STEPS = [1920, 1280, 960, 640];

/**
 * The follow-up to "Paling kecil bisa …": the same options with smaller
 * images. Null when the options have no Size limit or can't shrink further.
 */
export function withSmallerImages(options: ToolOptions): ToolOptions | null {
  if (options.tool !== "kompres-foto" || options.limit === undefined) return null;
  const current = options.maxDimension ?? Infinity;
  const next = SHRINK_STEPS.find((side) => side < current);
  return next === undefined ? null : { ...options, maxDimension: next };
}
