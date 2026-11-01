import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpen } from "@keyline-icons/react";
import { FileRow } from "@/components/blocks/FileRow";
import { ProblemRow } from "@/components/blocks/ProblemRow";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/errorMessages";
import { formatBytes, formatChange } from "@/lib/format";
import type { ComponentType } from "react";
import type { IconProps } from "@keyline-icons/react";
import { withSmallerImages } from "./imageSettings";
import { useT, type Translator } from "@/i18n";
import type { CompressJob, JobItem } from "./useCompressJob";

interface JobViewProps {
  job: CompressJob;
  /** The file kind's stroke icon. */
  icon: ComponentType<IconProps>;
  /** The formats the Tool opens, for "can't open this kind of file". */
  formats: string;
  onCompressMore: () => void;
}

/** Progress and results of the current batch. */
export function JobView({ job, icon, formats, onCompressMore }: JobViewProps) {
  const tr = useT();
  const { t } = tr;
  const { items, isRunning } = job;
  const finished = items.filter((item) => item.status !== "pending" && item.status !== "working");
  const cancelled = items.some((item) => item.status === "cancelled");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-12 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-title">
            {isRunning
              ? t("task.working", { current: Math.min(finished.length + 1, items.length), total: items.length })
              : cancelled
                ? t("task.cancelled")
                : t("task.done")}
          </h1>
          <p className="text-small text-text-muted">
            {isRunning ? t("task.savedNext") : summary(tr, items)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {isRunning ? (
            <Button variant="secondary" onPress={job.cancel}>
              {t("task.cancel")}
            </Button>
          ) : (
            <Button onPress={onCompressMore}>{t("task.again")}</Button>
          )}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {items.map((item, index) => (
          <JobRow
            key={item.path}
            tr={tr}
            item={item}
            icon={icon}
            formats={formats}
            canRetry={!isRunning}
            onRetry={(options) => job.retry(index, options)}
          />
        ))}
      </ul>
    </div>
  );
}

interface JobRowProps {
  tr: Translator;
  item: JobItem;
  icon: ComponentType<IconProps>;
  formats: string;
  canRetry: boolean;
  onRetry: (options?: JobItem["options"]) => void;
}

function JobRow({ tr, item, icon, formats, canRetry, onRetry }: JobRowProps) {
  const { t, locale } = tr;
  const common = { name: item.name, title: item.path, icon };

  switch (item.status) {
    case "pending":
      return <FileRow {...common} status="waiting" note={t("task.file.waiting")} />;
    case "working":
      return (
        <FileRow
          {...common}
          status="working"
          fraction={item.fraction}
          note={t("task.file.working", { percent: Math.round(item.fraction * 100) })}
        />
      );
    case "done":
      return (
        <FileRow
          {...common}
          status="done"
          note={t("task.file.done", {
            size: formatBytes(item.result.compressedBytes, locale),
            change: formatChange(item.result.originalBytes, item.result.compressedBytes),
          })}
          action={
            <Button
              variant="icon"
              aria-label={t("task.showInFolder")}
              onPress={() => revealItemInDir(item.result.outputPath)}
            >
              <FolderOpen aria-hidden className="size-5" />
            </Button>
          }
        />
      );
    case "cancelled":
      return <ProblemRow {...common} tone="cancelled" message={t("task.file.cancelled")} />;
    case "failed": {
      const smaller = item.error.code === "size-limit-unreachable" ? withSmallerImages(item.options) : null;
      return (
        <ProblemRow
          {...common}
          tone={smaller ? "limit" : "failed"}
          message={errorMessage(tr, item.error, { accepted: formats, canShrink: smaller !== null && canRetry })}
          action={
            !canRetry
              ? undefined
              : smaller
                ? { label: t("task.shrink"), onPress: () => onRetry(smaller) }
                : { label: t("task.retry"), onPress: () => onRetry() }
          }
        />
      );
    }
  }
}

function summary({ t, locale }: Translator, items: JobItem[]) {
  const done = items.flatMap((item) => (item.status === "done" ? [item.result] : []));
  const failed = items.filter((item) => item.status === "failed").length;
  const cancelled = items.filter((item) => item.status === "cancelled").length;
  const before = done.reduce((sum, r) => sum + r.originalBytes, 0);
  const after = done.reduce((sum, r) => sum + r.compressedBytes, 0);

  const parts = [];
  if (done.length > 0) {
    parts.push(`${formatBytes(before, locale)} → ${formatBytes(after, locale)} (${formatChange(before, after)})`);
  }
  if (failed > 0) parts.push(t("task.failedCount", { count: failed }));
  if (cancelled > 0) parts.push(t("task.cancelledCount", { count: cancelled }));
  return parts.join(" · ");
}
