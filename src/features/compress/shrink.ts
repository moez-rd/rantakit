/** How Kompres Foto and Kompres PDF make files smaller: to a Size limit, or just smaller. */
export interface ShrinkSettings {
  mode: "limit" | "smaller";
  /** The Size limit as typed, in `unit`; null when the field is empty. */
  limit: number | null;
  unit: "KB" | "MB";
}

export const SHRINK_DEFAULTS: ShrinkSettings = { mode: "limit", limit: null, unit: "KB" };

/** Falls back to the defaults for anything missing or invalid. */
export function parseShrink(stored: unknown): ShrinkSettings {
  const s = (stored ?? {}) as Partial<Record<keyof ShrinkSettings, unknown>>;
  return {
    mode: s.mode === "smaller" ? "smaller" : SHRINK_DEFAULTS.mode,
    limit: typeof s.limit === "number" && s.limit > 0 && Number.isFinite(s.limit) ? s.limit : null,
    unit: s.unit === "MB" ? "MB" : SHRINK_DEFAULTS.unit,
  };
}

const UNIT_BYTES = { KB: 1024, MB: 1024 * 1024 };

/** The Size limit in bytes; undefined for "Kecilkan saja" or an empty field, which compress like Seimbang. */
export function limitBytes(settings: ShrinkSettings): number | undefined {
  if (settings.mode !== "limit" || settings.limit === null) return undefined;
  return Math.round(settings.limit * UNIT_BYTES[settings.unit]);
}
