import { useCallback, useState } from "react";
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

const STORAGE_KEY = "dikompres.imageSettings";
const DEFAULTS: ImageSettings = {
  mode: "quality",
  quality: 80,
  targetKb: 500,
  format: "same",
  maxDimension: 0,
};

const isInt = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

/** Last-used settings, falling back to the defaults for anything missing or invalid. */
function loadSettings(): ImageSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      mode: stored.mode === "target" ? "target" : DEFAULTS.mode,
      quality: isInt(stored.quality, 1, 100) ? stored.quality : DEFAULTS.quality,
      targetKb: isInt(stored.targetKb, 1, 1_000_000) ? stored.targetKb : DEFAULTS.targetKb,
      format: ["same", "jpeg", "png"].includes(stored.format) ? stored.format : DEFAULTS.format,
      maxDimension: MAX_DIMENSIONS.includes(stored.maxDimension)
        ? stored.maxDimension
        : DEFAULTS.maxDimension,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Image settings that are remembered for the next batch. */
export function useImageSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const update = useCallback((patch: Partial<ImageSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Not being able to remember settings isn't worth interrupting the user.
      }
      return next;
    });
  }, []);

  return [settings, update] as const;
}

export function toRequest(path: string, settings: ImageSettings): ImageRequest {
  return {
    path,
    format: settings.format === "same" ? undefined : settings.format,
    quality: settings.quality,
    maxBytes: settings.mode === "target" ? settings.targetKb * 1024 : undefined,
    maxDimension: settings.maxDimension || undefined,
  };
}
