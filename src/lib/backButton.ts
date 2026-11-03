import { useEffect, useRef } from "react";
import { onBackButtonPress } from "@tauri-apps/api/app";
import type { PluginListener } from "@tauri-apps/api/core";
import { setInteractionModality } from "react-aria";
import { isAndroidApp } from "./platform";

/** The screens with a step to go back to, the newest last: it answers. */
const handlers: { current: () => void }[] = [];

/** Dialogs, and the popovers of pickers and menus. */
const OVERLAYS = '[role="dialog"], [role="alertdialog"], [data-trigger]';

/**
 * Closes the overlay on top the way Escape does, so it asks or cancels as
 * Escape would. React Aria listens for Escape on the overlay and on
 * whatever has focus inside it.
 */
function closeTopOverlay() {
  const overlays = document.querySelectorAll(OVERLAYS);
  const top = overlays[overlays.length - 1];
  if (!top) return false;
  const focused = document.activeElement;
  const target = focused && top.contains(focused) ? focused : top;
  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  // The gesture is a touch: the button focused again shows no keyboard focus ring.
  setInteractionModality("pointer");
  return true;
}

function onBack() {
  if (!closeTopOverlay()) handlers[handlers.length - 1]?.current();
}

let listener: Promise<PluginListener | null> | null = null;

/**
 * Listens to the back gesture only while it has something to do here.
 * Listening takes over Android's own handling, so with nothing open and no
 * step left, Android closes the app as its apps do.
 */
function sync() {
  const wanted = handlers.length > 0 || document.querySelector(OVERLAYS) !== null;
  if (wanted && !listener) {
    listener = onBackButtonPress(onBack).catch(() => null);
  } else if (!wanted && listener) {
    const stale = listener;
    listener = null;
    void stale.then((l) => l?.unregister());
  }
}

if (isAndroidApp) {
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      sync();
    });
  }).observe(document.body, { childList: true, subtree: true });
}

/**
 * The Android back gesture and back button. An open dialog or popover closes
 * first; otherwise `handler` runs while `enabled`, the newest screen first.
 */
export function useBackButton(handler: () => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled || !isAndroidApp) return;
    const entry = { current: () => ref.current() };
    handlers.push(entry);
    sync();
    return () => {
      handlers.splice(handlers.indexOf(entry), 1);
      sync();
    };
  }, [enabled]);
}
