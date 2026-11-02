import type { ComponentType } from "react";
import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  CircleCheck,
  CircleStop,
  FolderOpen,
  Share2,
  SquareArrowOutUpRight,
  TriangleAlert,
  type IconProps,
} from "@keyline-icons/react";
import { ProblemRow } from "@/components/blocks/ProblemRow";
import { Button } from "@/components/ui/Button";
import { fileName } from "@/features/compress/imageApi";
import { withSmallerImages } from "@/features/compress/imageSettings";
import { limitOf, type TaskResult } from "@/features/compress/taskApi";
import type { CompressJob, JobItem } from "@/features/compress/useCompressJob";
import { useT, type Translator } from "@/i18n";
import { errorMessage } from "@/lib/errorMessages";
import { openPath } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { isWindowsApp } from "@/lib/platform";
import { tv } from "@/lib/react-aria-utils";
import { useThumbnail } from "./fileInfo";
import { NOUN_ICONS } from "./FilesColumn";
import { unchangedNote } from "./unchanged";

interface ResultViewProps {
  job: CompressJob;
  noun: "photo" | "pdf";
  /** Where Results were saved; null next to each Original. */
  resultsFolder: string | null;
  onProcessAnother: () => void;
}

const card = tv({
  base: "flex items-start gap-4 rounded-[20px] border p-5",
  variants: {
    tone: {
      done: "border-border bg-surface",
      partial: "border-transparent bg-warn-soft",
      cancelled: "border-border bg-surface",
    },
  },
});

const cardIcon = tv({
  base: "mt-0.5 size-7 shrink-0",
  variants: { tone: { done: "text-success", partial: "text-warn", cancelled: "text-text-muted" } },
});

const TONE_ICONS: Record<"done" | "partial" | "cancelled", ComponentType<IconProps>> = {
  done: CircleCheck,
  partial: TriangleAlert,
  cancelled: CircleStop,
};

/** What a Task made: a summary, then each Result with its sizes and actions. Takes the full width. */
export function ResultView({ job, noun, resultsFolder, onProcessAnother }: ResultViewProps) {
  const tr = useT();
  const { t, count, locale } = tr;
  const { items } = job;
  const done = items.flatMap((item) => (item.status === "done" ? [item] : []));
  const cancelled = items.some((item) => item.status === "cancelled");
  const failed = items.filter((item) => item.status === "failed").length;
  const unchanged = items.filter((item) => item.status === "unchanged").length;
  const finished = done.length + unchanged;
  const tone = cancelled ? "cancelled" : failed > 0 ? "partial" : "done";
  const files = count(`files.${noun}`, items.length);
  const limit = done.length > 0 ? limitOf(done[0].options) : undefined;

  const title = {
    done: t("result.done", { files }),
    partial: t("result.partial", { done: finished, files }),
    cancelled: t("result.cancelled", { done: finished, files }),
  }[tone];
  const saved = resultsFolder ? t("result.savedIn", { folder: resultsFolder }) : t("result.savedNext");
  const body = {
    done:
      done.length === 0
        ? t("result.nothingChanged")
        : limit
          ? `${t("result.underLimit.all", { limit: formatBytes(limit, locale) })} ${saved}`
          : saved,
    partial: t("result.partial.body", { failed: count(`files.${noun}`, failed) }),
    cancelled: t(`result.cancelled.body.${noun}`),
  }[tone];
  const ToneIcon = TONE_ICONS[tone];

  return (
    <div className="flex flex-col gap-6">
      <div className={card({ tone })}>
        <ToneIcon aria-hidden className={cardIcon({ tone })} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-display text-section">{title}</h2>
          <p className="text-text-muted">{body}</p>
        </div>
        <Button onPress={onProcessAnother}>{t("result.another")}</Button>
      </div>

      {items.length === 1 && done.length === 1 ? (
        <OneResult item={done[0]} noun={noun} />
      ) : (
        <ul
          aria-label={t("result.list")}
          className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface"
        >
          {items.map((item, index) => (
            <ResultRow
              key={item.path}
              tr={tr}
              item={item}
              noun={noun}
              canRetry={!job.isRunning}
              onRetry={(options) => job.retry(index, options)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type DoneItem = Extract<JobItem, { status: "done" }>;

function shareResults(paths: string[]) {
  invoke("share_files", { paths }).catch(() => {});
}

/** Buka, Tampilkan di folder, and on Windows Bagikan. */
function ResultActions({ result, name }: { result: TaskResult; name: string }) {
  const { t } = useT();
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="row"
        aria-label={t("result.openName", { name })}
        onPress={() => openPath(result.outputPath)}
      >
        <SquareArrowOutUpRight aria-hidden className="size-[18px]" /> {t("result.open")}
      </Button>
      <Button variant="secondary" size="row" onPress={() => revealItemInDir(result.outputPath)}>
        <FolderOpen aria-hidden className="size-[18px]" /> {t("task.showInFolder")}
      </Button>
      {isWindowsApp && (
        <Button variant="secondary" size="row" onPress={() => shareResults([result.outputPath])}>
          <Share2 aria-hidden className="size-[18px]" /> {t("result.share")}
        </Button>
      )}
    </div>
  );
}

function UnderLimit({ item }: { item: DoneItem }) {
  const { t, locale } = useT();
  const limit = limitOf(item.options);
  if (!limit || item.result.compressedBytes > limit) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-small font-semibold text-success">
      <CircleCheck aria-hidden className="size-4" />
      {t("result.underLimit", { limit: formatBytes(limit, locale) })}
    </span>
  );
}

function Sizes({ result }: { result: TaskResult }) {
  const { locale } = useT();
  return (
    <span className="text-small text-text-muted">
      {formatBytes(result.originalBytes, locale)} → {formatBytes(result.compressedBytes, locale)}
    </span>
  );
}

function ResultTile({ path, noun, size }: { path: string; noun: "photo" | "pdf"; size: number }) {
  const thumbnail = useThumbnail(noun === "photo" ? path : null, size);
  const Icon = NOUN_ICONS[noun];
  return (
    <span
      aria-hidden
      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-badge-bg text-text-muted"
    >
      {thumbnail ? <img src={thumbnail} alt="" className="size-full object-cover" /> : <Icon className="size-6" />}
    </span>
  );
}

interface ResultRowProps {
  tr: Translator;
  item: JobItem;
  noun: "photo" | "pdf";
  canRetry: boolean;
  onRetry: (options?: JobItem["options"]) => void;
}

function ResultRow({ tr, item, noun, canRetry, onRetry }: ResultRowProps) {
  const { t } = tr;
  const common = { name: item.name, title: item.path, icon: NOUN_ICONS[noun] };

  switch (item.status) {
    case "done": {
      const name = fileName(item.result.outputPath);
      return (
        <li className="flex flex-wrap items-center gap-4 px-4 py-3.5">
          <ResultTile path={item.result.outputPath} noun={noun} size={112} />
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="max-w-full truncate text-label" title={item.result.outputPath}>
              {name}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Sizes result={item.result} />
              <UnderLimit item={item} />
            </span>
          </span>
          <ResultActions result={item.result} name={name} />
        </li>
      );
    }
    case "unchanged":
      return <ProblemRow {...common} tone="unchanged" message={unchangedNote(t, item.options)} />;
    case "cancelled":
    case "pending":
    case "working":
      return <ProblemRow {...common} tone="cancelled" message={t("task.file.cancelled")} />;
    case "failed": {
      const smaller = item.error.code === "size-limit-unreachable" ? withSmallerImages(item.options) : null;
      return (
        <ProblemRow
          {...common}
          tone={smaller || item.error.code === "size-limit-unreachable" ? "limit" : "failed"}
          message={errorMessage(tr, item.error, {
            accepted: t(`formats.${noun}`),
            canShrink: smaller !== null && canRetry,
          })}
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

/** A Task with one file: a large preview, the sizes before and after, and the actions. */
function OneResult({ item, noun }: { item: DoneItem; noun: "photo" | "pdf" }) {
  const { t, locale } = useT();
  const preview = useThumbnail(noun === "photo" ? item.result.outputPath : null, 800);
  const Icon = NOUN_ICONS[noun];
  const name = fileName(item.result.outputPath);

  return (
    <div className="flex flex-col gap-6 rounded-[20px] border border-border bg-surface p-5 md:flex-row md:items-center">
      <div className="flex h-[280px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-badge-bg text-text-muted md:w-[400px]">
        {preview ? (
          <img src={preview} alt="" className="size-full object-contain" />
        ) : (
          <Icon aria-hidden className="size-12" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
        <div className="flex max-w-full flex-col gap-1">
          <span className="text-small font-semibold text-text-muted">{t("result.label")}</span>
          <span className="truncate text-label" title={item.result.outputPath}>
            {name}
          </span>
        </div>
        <dl className="flex gap-8">
          <div className="flex flex-col gap-0.5">
            <dt className="text-small text-text-muted">{t("result.before")}</dt>
            <dd className="text-section">{formatBytes(item.result.originalBytes, locale)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-small text-text-muted">{t("result.after")}</dt>
            <dd className="text-section text-brand-strong">{formatBytes(item.result.compressedBytes, locale)}</dd>
          </div>
        </dl>
        <UnderLimit item={item} />
        <ResultActions result={item.result} name={name} />
      </div>
    </div>
  );
}
