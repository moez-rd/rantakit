import { useSyncExternalStore } from "react";

/** Tailwind's `md`: from here the sidebar and side-by-side layout replace the phone layout. */
const wide = window.matchMedia("(min-width: 48rem)");

const subscribe = (onChange: () => void) => {
  wide.addEventListener("change", onChange);
  return () => wide.removeEventListener("change", onChange);
};

/** Whether the window is wide enough for the sidebar layout; changes as a phone turns. */
export function useWideLayout() {
  return useSyncExternalStore(subscribe, () => wide.matches);
}
