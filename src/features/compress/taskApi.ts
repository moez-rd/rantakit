import { Channel, invoke } from "@tauri-apps/api/core";

/** Mirrors `OptionsRequest` in `src-tauri/src/commands/task.rs`. */
export type ToolOptions =
  | {
      tool: "kompres-foto";
      /** Output format; omit to keep the Original's format. */
      format?: "jpeg" | "png";
      /** 1–100, defaults to 80 on the Rust side. */
      quality?: number;
      /** Aim for this Size limit instead of a fixed quality. */
      maxBytes?: number;
      maxDimension?: number;
    }
  | {
      tool: "kompres-pdf";
      /** JPEG quality for images inside the PDF, 1–100; defaults to 70 on the Rust side. */
      quality?: number;
      maxDimension?: number;
    };

/** The Size limit in bytes these options aim for, if any. */
export function limitOf(options: ToolOptions): number | undefined {
  return options.tool === "kompres-foto" ? options.maxBytes : undefined;
}

/** Mirrors `TaskRequest` in `src-tauri/src/commands/task.rs`. */
export interface TaskRequest {
  options: ToolOptions;
  paths: string[];
  /** The Results folder chosen in Settings; omit to save next to each Original. */
  resultsFolder?: string;
}

/** Mirrors `ResultMessage` in `src-tauri/src/commands/task.rs`. */
export interface TaskResult {
  inputPath: string;
  outputPath: string;
  originalBytes: number;
  compressedBytes: number;
}

/** Mirrors `ErrorMessage`: an error kind as a code, turned into words by `errorMessage`. */
export interface TaskError {
  code: string;
  /** Smallest size reached, for "size-limit-unreachable". */
  best?: number;
}

/** Mirrors `TaskMessage`. `file` is an index into the request's `paths`. */
export type TaskMessage =
  | { event: "progress"; file: number; fraction: number }
  | {
      event: "fileDone";
      file: number;
      outcome: { status: "done"; result: TaskResult } | { status: "failed"; error: TaskError };
    }
  | { event: "finished" };

/** Starts a Task and resolves with its id for `cancelTask`. Messages keep arriving on `onMessage` until "finished". */
export function startTask(request: TaskRequest, onMessage: (message: TaskMessage) => void) {
  const onEvent = new Channel<TaskMessage>();
  onEvent.onmessage = onMessage;
  return invoke<number>("start_task", { request, onEvent });
}

/** Finished Results stay; the file being worked on leaves nothing behind. */
export function cancelTask(id: number) {
  return invoke<void>("cancel_task", { id });
}
