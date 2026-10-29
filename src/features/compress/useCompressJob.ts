import { useCallback, useRef, useState } from "react";
import { fileName } from "./imageApi";
import type { CompressResult, FileKind } from "./fileKinds";

export type JobItem =
  | { path: string; name: string; status: "pending" | "working" }
  | { path: string; name: string; status: "done"; result: CompressResult }
  | { path: string; name: string; status: "failed"; error: string };

/** Compresses a batch of files one at a time and tracks each file's status. */
export function useCompressJob() {
  const [kind, setKind] = useState<FileKind>("image");
  const [items, setItems] = useState<JobItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const running = useRef(false);

  const start = useCallback(
    async (kind: FileKind, paths: string[], compress: (path: string) => Promise<CompressResult>) => {
      // Ignore a new batch (e.g. from the menu) while one is still running.
      if (running.current || paths.length === 0) return;
      running.current = true;
      setIsRunning(true);

      setKind(kind);
      setItems(paths.map((path) => ({ path, name: fileName(path), status: "pending" })));
      const update = (index: number, item: JobItem) =>
        setItems((prev) => prev.map((old, i) => (i === index ? item : old)));

      for (const [index, path] of paths.entries()) {
        const name = fileName(path);
        update(index, { path, name, status: "working" });
        try {
          const result = await compress(path);
          update(index, { path, name, status: "done", result });
        } catch (error) {
          update(index, { path, name, status: "failed", error: String(error) });
        }
      }

      running.current = false;
      setIsRunning(false);
    },
    [],
  );

  const clear = useCallback(() => {
    if (!running.current) setItems([]);
  }, []);

  return { kind, items, isRunning, start, clear };
}

export type CompressJob = ReturnType<typeof useCompressJob>;
