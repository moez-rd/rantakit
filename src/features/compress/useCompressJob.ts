import { useCallback, useRef, useState } from "react";
import { fileName } from "./imageApi";
import type { FileKind } from "./fileKinds";
import {
  cancelTask,
  startTask,
  type TaskError,
  type TaskMessage,
  type TaskResult,
  type ToolOptions,
} from "./taskApi";

export type JobItem =
  | { path: string; name: string; status: "pending" | "cancelled" }
  | { path: string; name: string; status: "working"; fraction: number }
  | { path: string; name: string; status: "done"; result: TaskResult }
  | { path: string; name: string; status: "failed"; error: TaskError };

/** Runs one Task over a batch of files and tracks each file's status. */
export function useCompressJob() {
  const [kind, setKind] = useState<FileKind>("image");
  const [items, setItems] = useState<JobItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const running = useRef(false);
  const taskId = useRef<number | null>(null);

  const finish = useCallback(() => {
    running.current = false;
    taskId.current = null;
    setIsRunning(false);
  }, []);

  const start = useCallback(
    async (kind: FileKind, paths: string[], options: ToolOptions) => {
      // Ignore a new batch (e.g. from the menu) while one is still running.
      if (running.current || paths.length === 0) return;
      running.current = true;
      setIsRunning(true);

      setKind(kind);
      setItems(paths.map((path) => ({ path, name: fileName(path), status: "pending" })));
      const update = (index: number, change: (item: JobItem) => JobItem) =>
        setItems((prev) => prev.map((old, i) => (i === index ? change(old) : old)));

      const onMessage = (message: TaskMessage) => {
        switch (message.event) {
          case "progress":
            return update(message.file, ({ path, name }) => ({
              path,
              name,
              status: "working",
              fraction: message.fraction,
            }));
          case "fileDone": {
            const { outcome } = message;
            return update(message.file, ({ path, name }) => {
              if (outcome.status === "done") return { path, name, status: "done", result: outcome.result };
              if (outcome.error.code === "cancelled") return { path, name, status: "cancelled" };
              return { path, name, status: "failed", error: outcome.error };
            });
          }
          case "finished":
            return finish();
        }
      };

      try {
        const id = await startTask({ options, paths }, onMessage);
        // A short Task may already be over by the time its id arrives.
        if (running.current) taskId.current = id;
      } catch (error) {
        const failed = { code: (error as TaskError | undefined)?.code ?? "unexpected" };
        setItems((prev) => prev.map(({ path, name }) => ({ path, name, status: "failed", error: failed })));
        finish();
      }
    },
    [finish],
  );

  /** Stops the running Task; finished Results stay. */
  const cancel = useCallback(() => {
    if (taskId.current !== null) cancelTask(taskId.current);
  }, []);

  const clear = useCallback(() => {
    if (!running.current) setItems([]);
  }, []);

  return { kind, items, isRunning, start, cancel, clear };
}

export type CompressJob = ReturnType<typeof useCompressJob>;
