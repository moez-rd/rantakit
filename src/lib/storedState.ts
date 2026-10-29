import { useCallback, useState } from "react";

/**
 * State remembered in localStorage between sessions. `parse` receives whatever was
 * stored (possibly nothing or garbage) and must return a valid value.
 */
export function useStoredState<T extends object>(key: string, parse: (stored: unknown) => T) {
  const [value, setValue] = useState(() => {
    try {
      return parse(JSON.parse(localStorage.getItem(key) ?? "null"));
    } catch {
      return parse(null);
    }
  });

  const update = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Not being able to remember settings isn't worth interrupting the user.
        }
        return next;
      });
    },
    [key],
  );

  return [value, update] as const;
}

export const isInt = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
