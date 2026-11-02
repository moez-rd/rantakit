import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { UNIT_BYTES, type ShrinkSettings } from "./shrink";

/** The last Size limits used by either compress Tool, in bytes, newest first. */
export function useRecentLimits() {
  const [limits, setLimits] = useState<number[]>([]);
  useEffect(() => {
    let current = true;
    invoke<number[]>("recent_limits")
      .then((read) => current && setLimits(read))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);
  return limits;
}

/** A Size limit in bytes as the field shows it: 204800 → 200 KB, 1572864 → 1.5 MB. */
export function asTyped(bytes: number): Pick<ShrinkSettings, "limit" | "unit"> {
  const unit = bytes >= UNIT_BYTES.MB ? "MB" : "KB";
  return { limit: Math.round((bytes / UNIT_BYTES[unit]) * 10) / 10, unit };
}
