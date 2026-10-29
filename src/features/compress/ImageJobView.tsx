import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { CheckCircle2, Circle, FolderOpen, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatChange } from "@/lib/format";
import type { ImageJob, JobItem } from "./useImageJob";

interface ImageJobViewProps {
  job: ImageJob;
  onCompressMore: () => void;
}

export function ImageJobView({ job, onCompressMore }: ImageJobViewProps) {
  const { items, isRunning } = job;
  const finished = items.filter((item) => item.status === "done" || item.status === "failed");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-medium">
            {isRunning
              ? `Mengompres ${finished.length + 1} dari ${items.length} gambar…`
              : "Selesai"}
          </h1>
          <p className="text-sm text-muted">{isRunning ? "Hasil disimpan di folder aslinya." : summary(items)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" isDisabled={isRunning} onPress={job.clear}>
            Tutup
          </Button>
          <Button isDisabled={isRunning} onPress={onCompressMore}>
            Kompres lagi
          </Button>
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
        <p className="truncate text-sm font-medium" title={item.path}>
          {item.name}
        </p>
        <p className="truncate text-xs text-muted">
          {item.status === "pending" && "Menunggu"}
          {item.status === "working" && "Memproses…"}
          {item.status === "done" && (
            <>
              {formatBytes(item.result.originalBytes)} → {formatBytes(item.result.compressedBytes)}{" "}
              <span
                className={
                  item.result.compressedBytes < item.result.originalBytes ? "text-success" : "text-warning"
                }
              >
                {formatChange(item.result.originalBytes, item.result.compressedBytes)}
              </span>
            </>
          )}
          {item.status === "failed" && <span className="text-danger">Gagal: {item.error}</span>}
        </p>
      </div>
      {item.status === "done" && (
        <Button
          variant="quiet"
          aria-label="Tampilkan di folder"
          onPress={() => revealItemInDir(item.result.outputPath)}
        >
          <FolderOpen aria-hidden className="size-4" />
        </Button>
      )}
    </li>
  );
}

function StatusIcon({ status }: { status: JobItem["status"] }) {
  const className = "size-5 shrink-0";
  switch (status) {
    case "pending":
      return <Circle aria-hidden className={`${className} text-muted`} />;
    case "working":
      return <Loader2 aria-hidden className={`${className} animate-spin text-primary`} />;
    case "done":
      return <CheckCircle2 aria-hidden className={`${className} text-success`} />;
    case "failed":
      return <XCircle aria-hidden className={`${className} text-danger`} />;
  }
}

function summary(items: JobItem[]) {
  const done = items.flatMap((item) => (item.status === "done" ? [item.result] : []));
  const failed = items.length - done.length;
  const before = done.reduce((sum, r) => sum + r.originalBytes, 0);
  const after = done.reduce((sum, r) => sum + r.compressedBytes, 0);

  const parts = [];
  if (done.length > 0) {
    parts.push(`${formatBytes(before)} → ${formatBytes(after)} (${formatChange(before, after)})`);
  }
  if (failed > 0) parts.push(`${failed} gagal`);
  return parts.join(" · ");
}
