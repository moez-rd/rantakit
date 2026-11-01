import { useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

/** Size in bytes of each path, filled in as they are read. Unknown sizes are missing. */
export function useFileSizes(paths: string[]) {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const key = paths.join("\n");

  useEffect(() => {
    const missing = paths.filter((path) => !(path in sizes));
    if (!isTauri() || missing.length === 0) return;
    let current = true;
    invoke<(number | null)[]>("file_sizes", { paths: missing })
      .then((found) => {
        if (!current) return;
        setSizes((prev) => {
          const next = { ...prev };
          missing.forEach((path, i) => {
            if (found[i] !== null) next[path] = found[i];
          });
          return next;
        });
      })
      .catch(() => {});
    return () => {
      current = false;
    };
    // `sizes` is a cache; only new paths need reading.
  }, [key]);

  return sizes;
}
