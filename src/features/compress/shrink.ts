/** How Kompres Foto and Kompres PDF make files smaller: to a Size limit, or just smaller. */
export interface ShrinkSettings {
  mode: "limit" | "smaller";
  /** The Size limit as typed, in `unit`; null when the field is empty. */
  limit: number | null;
  unit: "KB" | "MB";
  /** "Kecilkan saja": how small. */
  level: Level;
}

export type Level = "smallest" | "balanced" | "clearest";
export const LEVELS: Level[] = ["smallest", "balanced", "clearest"];

export const SHRINK_DEFAULTS: ShrinkSettings = { mode: "limit", limit: null, unit: "KB", level: "balanced" };

/** Falls back to the defaults for anything missing or invalid. */
export function parseShrink(stored: unknown): ShrinkSettings {
  const s = (stored ?? {}) as Partial<Record<keyof ShrinkSettings, unknown>>;
  return {
    mode: s.mode === "smaller" ? "smaller" : SHRINK_DEFAULTS.mode,
    limit: typeof s.limit === "number" && s.limit > 0 && Number.isFinite(s.limit) ? s.limit : null,
    unit: s.unit === "MB" ? "MB" : SHRINK_DEFAULTS.unit,
    level: LEVELS.includes(s.level as Level) ? (s.level as Level) : SHRINK_DEFAULTS.level,
  };
}

export const UNIT_BYTES = { KB: 1024, MB: 1024 * 1024 };

/** The Size limit in bytes; undefined for "Kecilkan saja" or an empty field, which compress like Seimbang. */
export function limitBytes(settings: ShrinkSettings): number | undefined {
  if (settings.mode !== "limit" || settings.limit === null) return undefined;
  return Math.round(settings.limit * UNIT_BYTES[settings.unit]);
}

/** The Level to send: the chosen one for "Kecilkan saja"; a limit left empty compresses like Seimbang. */
export function levelOf(settings: ShrinkSettings): Level | undefined {
  return settings.mode === "smaller" ? settings.level : undefined;
}
