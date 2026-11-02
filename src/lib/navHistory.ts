import { useEffect, useState } from "react";

/**
 * Back and Forward over the pages the user visited, like a browser: a new
 * page drops the Forward steps, and the page already on screen adds none.
 * Kept in memory only, so every launch starts fresh.
 *
 * `current` is the page on screen. Each change of it is recorded, except one
 * made by `go`, which only moves along the steps already there.
 */
export function useNavHistory<T extends string>(current: T) {
  const [state, setState] = useState({ entries: [current], index: 0 });

  useEffect(() => {
    setState((s) =>
      s.entries[s.index] === current ? s : { entries: [...s.entries.slice(0, s.index + 1), current], index: s.index + 1 },
    );
  }, [current]);

  return {
    canBack: state.index > 0,
    canForward: state.index < state.entries.length - 1,
    /** The page `delta` steps away, if any. */
    target: (delta: -1 | 1): T | undefined => state.entries[state.index + delta],
    /** Move `delta` steps; call it in the same update that shows `target(delta)`. */
    go: (delta: -1 | 1) => setState((s) => ({ ...s, index: s.index + delta })),
  };
}
