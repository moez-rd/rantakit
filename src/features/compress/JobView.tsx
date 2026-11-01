import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { CircleCheck, Circle, CircleStop, CircleX, FolderOpen, LoaderCircle } from "@keyline-icons/react";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/errorMessages";
import { formatBytes, formatChange } from "@/lib/format";
import { FILE_KINDS } from "./fileKinds";
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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-medium">
            {isRunning
              ? `Mengompres ${Math.min(finished.length + 1, items.length)} dari ${items.length} ${noun}…`
              : cancelled
                ? "Dibatalkan"
                : "Selesai"}
          </h1>
          <p className="text-small text-text-muted">{isRunning ? "Hasil disimpan di folder aslinya." : summary(items)}</p>
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

      <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((item) => (
          <JobRow key={item.path} item={item} />
        ))}
      </ul>
    </div>
  );
}

function JobRow({ item }: { item: JobItem }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium" title={item.path}>
          {item.name}
        </p>
        <p className="truncate text-small text-text-muted">
          {item.status === "pending" && "Menunggu"}
          {item.status === "working" && `Memproses… ${Math.round(item.fraction * 100)}%`}
          {item.status === "cancelled" && "Dibatalkan"}
          {item.status === "done" && (
            <>
              {formatBytes(item.result.originalBytes)} → {formatBytes(item.result.compressedBytes)}{" "}
              <span
                className={
                  item.result.compressedBytes < item.result.originalBytes ? "text-success" : "text-warn"
                }
              >
                {formatChange(item.result.originalBytes, item.result.compressedBytes)}
              </span>
            </>
          )}
          {item.status === "failed" && <span className="text-danger">Gagal: {errorMessage(item.error)}</span>}
        </p>
      </div>
      {item.status === "done" && (
        <Button
          variant="quiet"
          aria-label="Tampilkan di folder"
          onPress={() => revealItemInDir(item.result.outputPath)}
        >
          <FolderOpen aria-hidden className="size-5" />
        </Button>
      )}
    </li>
  );
}

function StatusIcon({ status }: { status: JobItem["status"] }) {
  const className = "size-5 shrink-0";
  switch (status) {
    case "pending":
      return <Circle aria-hidden className={`${className} text-text-muted`} />;
    case "working":
      return <LoaderCircle aria-hidden className={`${className} animate-spin text-brand-strong`} />;
    case "done":
      return <CircleCheck aria-hidden className={`${className} text-success`} />;
    case "failed":
      return <CircleX aria-hidden className={`${className} text-danger`} />;
    case "cancelled":
      return <CircleStop aria-hidden className={`${className} text-text-muted`} />;
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
