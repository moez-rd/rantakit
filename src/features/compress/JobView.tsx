import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpen } from "@keyline-icons/react";
import { FileRow } from "@/components/blocks/FileRow";
import { ProblemRow } from "@/components/blocks/ProblemRow";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/errorMessages";
import { formatBytes, formatChange } from "@/lib/format";
import { FILE_KINDS } from "./fileKinds";
import { withSmallerImages } from "./imageSettings";
import type { CompressJob, JobItem } from "./useCompressJob";

interface JobViewProps {
  job: CompressJob;
  onCompressMore: () => void;
}

/** Progress and results of the current batch. */
export function JobView({ job, onCompressMore }: JobViewProps) {
  const { items, isRunning } = job;
  const { noun } = FILE_KINDS[job.kind];
  const finished = items.filter((item) => item.status !== "pending" && item.status !== "working");
  const cancelled = items.some((item) => item.status === "cancelled");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-12 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-title">
            {isRunning
              ? `Mengompres ${Math.min(finished.length + 1, items.length)} dari ${items.length} ${noun}…`
              : cancelled
                ? "Dibatalkan"
                : "Selesai"}
          </h1>
          <p className="text-small text-text-muted">
            {isRunning ? "Hasil disimpan di folder aslinya." : summary(items)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {isRunning ? (
            <Button variant="secondary" onPress={job.cancel}>
              Batalkan
            </Button>
          ) : (
            <>
              <Button variant="secondary" onPress={job.clear}>
                Tutup
              </Button>
              <Button onPress={onCompressMore}>Kompres lagi</Button>
            </>
          )}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((item, index) => (
          <JobRow
            key={item.path}
            item={item}
            icon={FILE_KINDS[job.kind].icon}
            canRetry={!isRunning}
            onRetry={(options) => job.retry(index, options)}
          />
        ))}
      </ul>
    </div>
  );
}

interface JobRowProps {
  item: JobItem;
  icon: (typeof FILE_KINDS)["image"]["icon"];
  canRetry: boolean;
  onRetry: (options?: JobItem["options"]) => void;
}

function JobRow({ item, icon, canRetry, onRetry }: JobRowProps) {
  const common = { name: item.name, title: item.path, icon };

  switch (item.status) {
    case "pending":
      return <FileRow {...common} status="waiting" note="Menunggu" />;
    case "working":
      return (
        <FileRow
          {...common}
          status="working"
          fraction={item.fraction}
          note={`Mengompres… ${Math.round(item.fraction * 100)}%`}
        />
      );
    case "done":
      return (
        <FileRow
          {...common}
          status="done"
          note={`Selesai · ${formatBytes(item.result.compressedBytes)} (${formatChange(
            item.result.originalBytes,
            item.result.compressedBytes,
          )})`}
          action={
            <Button
              variant="icon"
              aria-label="Tampilkan di folder"
              onPress={() => revealItemInDir(item.result.outputPath)}
            >
              <FolderOpen aria-hidden className="size-5" />
            </Button>
          }
        />
      );
    case "cancelled":
      return <ProblemRow {...common} tone="cancelled" message="Dibatalkan" />;
    case "failed": {
      const smaller = item.error.code === "size-limit-unreachable" ? withSmallerImages(item.options) : null;
      return (
        <ProblemRow
          {...common}
          tone={smaller ? "limit" : "failed"}
          message={errorMessage(item.error)}
          action={
            !canRetry
              ? undefined
              : smaller
                ? { label: "Ya, kecilkan", onPress: () => onRetry(smaller) }
                : { label: "Coba lagi", onPress: () => onRetry() }
          }
        />
      );
    }
  }
}

function summary(items: JobItem[]) {
  const done = items.flatMap((item) => (item.status === "done" ? [item.result] : []));
  const failed = items.filter((item) => item.status === "failed").length;
  const cancelled = items.filter((item) => item.status === "cancelled").length;
  const before = done.reduce((sum, r) => sum + r.originalBytes, 0);
  const after = done.reduce((sum, r) => sum + r.compressedBytes, 0);

  const parts = [];
  if (done.length > 0) {
    parts.push(`${formatBytes(before)} → ${formatBytes(after)} (${formatChange(before, after)})`);
  }
  if (failed > 0) parts.push(`${failed} gagal`);
  if (cancelled > 0) parts.push(`${cancelled} dibatalkan`);
  return parts.join(" · ");
}
