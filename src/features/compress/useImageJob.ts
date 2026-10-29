import { useCallback, useRef, useState } from "react";
import { compressImage, fileName, type ImageResult } from "./imageApi";
import { toRequest, type ImageSettings } from "./imageSettings";

export type JobItem =
  | { path: string; name: string; status: "pending" | "working" }
  | { path: string; name: string; status: "done"; result: ImageResult }
  | { path: string; name: string; status: "failed"; error: string };

/** Compresses a batch of images one at a time and tracks each file's status. */
export function useImageJob() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const running = useRef(false);

  const start = useCallback(async (paths: string[], settings: ImageSettings) => {
    // Ignore a new batch (e.g. from the menu) while one is still running.
    if (running.current || paths.length === 0) return;
    running.current = true;
    setIsRunning(true);

    setItems(paths.map((path) => ({ path, name: fileName(path), status: "pending" })));
    const update = (index: number, item: JobItem) =>
      setItems((prev) => prev.map((old, i) => (i === index ? item : old)));

    for (const [index, path] of paths.entries()) {
      const name = fileName(path);
      update(index, { path, name, status: "working" });
      try {
        const result = await compressImage(toRequest(path, settings));
        update(index, { path, name, status: "done", result });
      } catch (error) {
        update(index, { path, name, status: "failed", error: String(error) });
      }
    }

    running.current = false;
    setIsRunning(false);
  }, []);

  const clear = useCallback(() => {
    if (!running.current) setItems([]);
  }, []);

  return { items, isRunning, start, clear };
}

export type ImageJob = ReturnType<typeof useImageJob>;
