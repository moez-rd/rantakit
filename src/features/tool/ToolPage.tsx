import { useState } from "react";
import { ArrowLeft, BookmarkPlus, ChevronRight } from "@keyline-icons/react";
import { Button as AriaButton, ProgressBar } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import type { ToolOptions } from "@/features/compress/taskApi";
import type { CompressJob, JobItem } from "@/features/compress/useCompressJob";
import { TOOL_ICONS } from "@/features/home/tools";
import { ManagePresetsDialog, SavePresetDialog } from "@/features/presets/PresetDialogs";
import { PresetPicker } from "@/features/presets/PresetPicker";
import { usePresets } from "@/features/presets/presetsApi";
import { useAppSettings } from "@/features/settings/appSettings";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";
import { useStoredState } from "@/lib/storedState";
import { useFileInfo, type FileInfo } from "./fileInfo";
import { FilesColumn } from "./FilesColumn";
import { ResultView } from "./ResultView";
import { toolDef, type ShippedTool } from "./tools";
import { unchangedNote } from "./unchanged";

interface ToolPageProps {
  tool: ShippedTool;
  paths: string[];
  job: CompressJob;
  onPick: () => void;
  onRemove: (path: string) => void;
  onBack: () => void;
  onStart: (options: ToolOptions) => void;
  onProcessAnother: () => void;
}

/**
 * Every Tool's page: Files on the left, Options on the right with one main
 * button. Render it with `key={tool}`; each Tool keeps its own settings.
 */
export function ToolPage({ tool, paths, job, onPick, onRemove, onBack, onStart, onProcessAnother }: ToolPageProps) {
  const { t, count } = useT();
  const def = toolDef(tool);
  const [settings, updateSettings] = def.useSettings();
  const { presets, save, rename, remove } = usePresets(tool);
  /** The Preset whose options are in use; any change of an option leaves it. */
  const [presetId, setPresetId] = useState<string | null>(null);
  const [presetDialog, setPresetDialog] = useState<"save" | "manage" | null>(null);
  const update = (patch: Partial<typeof settings>) => {
    updateSettings(patch);
    setPresetId(null);
  };
  const appSettings = useAppSettings();
  const infos = useFileInfo(paths);
  const files = paths.flatMap((path) => (infos[path] ? [infos[path]] : []));
  const request = def.toRequest(settings, files);
  const skipNote = def.leavesUnchanged
    ? (info: FileInfo) => (def.leavesUnchanged!(request, info) ? unchangedNote(t, request) : null)
    : undefined;
  const Icon = TOOL_ICONS[tool];
  const running = job.isRunning;
  const hasResult = !running && job.items.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-10 pt-6 pb-10">
      <header className="flex flex-col items-start gap-4">
        <Button variant="link" onPress={onBack}>
          <ArrowLeft aria-hidden className="size-5" /> {t("tool.back")}
        </Button>
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <Icon aria-hidden className="size-7" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-title">{t(`tool.${tool}`)}</h1>
            <p className="text-text-muted">{t(`tool.${tool}.description`)}</p>
          </div>
        </div>
      </header>

      {hasResult ? (
        <ResultView job={job} noun={def.noun} resultsFolder={appSettings?.resultsFolder ?? null} onProcessAnother={onProcessAnother} />
      ) : (
        <div className="flex flex-1 flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <section aria-label={t(`files.pick.${def.noun}`)} className="flex min-w-0 flex-1 flex-col">
            <FilesColumn
              noun={def.noun}
              paths={paths}
              items={running ? job.items : undefined}
              skipNote={skipNote}
              onPick={onPick}
              onRemove={onRemove}
            />
          </section>

          <aside
            aria-label={t("options.label")}
            className="flex shrink-0 flex-col rounded-[20px] border border-border bg-surface lg:sticky lg:top-6 lg:max-h-[calc(100dvh-12rem)] lg:w-[380px]"
          >
            <div
              inert={running}
              className={`flex flex-col gap-[22px] overflow-y-auto p-5 transition-opacity ${running ? "opacity-45" : ""}`}
            >
              <PresetPicker
                presets={presets}
                selected={presetId}
                onSelect={(preset) => {
                  if (preset) updateSettings(preset.options);
                  setPresetId(preset?.id ?? null);
                }}
                onManage={() => setPresetDialog("manage")}
              />
              <def.Main settings={settings} onChange={update} files={files} />
              {def.Advanced && (def.showAdvanced?.(settings, files) ?? true) && (
                <MoreOptions tool={tool}>
                  <def.Advanced settings={settings} onChange={update} files={files} />
                </MoreOptions>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-border p-5">
              {running ? (
                <Working
                  label={t(`working.${tool}`, {
                    current: Math.min(job.items.filter(isFinished).length + 1, job.items.length),
                    files: count(`files.${def.noun}`, job.items.length),
                  })}
                  fraction={overall(job.items)}
                  onCancel={job.cancel}
                />
              ) : (
                <>
                  <Button variant="link" className="self-center" onPress={() => setPresetDialog("save")}>
                    <BookmarkPlus aria-hidden className="size-5" /> {t("preset.save")}
                  </Button>
                  <Button isDisabled={paths.length === 0} onPress={() => onStart(request)}>
                    {t(`main.${tool}`)}
                  </Button>
                </>
              )}
              {!running && paths.length === 0 && (
                <p className="text-center text-small text-text-muted">{t(`options.needFiles.${def.noun}`)}</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {presetDialog === "save" && (
        <SavePresetDialog
          onClose={() => setPresetDialog(null)}
          onSave={async (name) => {
            setPresetDialog(null);
            const preset = await save(name, settings).catch(() => null);
            if (preset) setPresetId(preset.id);
          }}
        />
      )}
      {presetDialog === "manage" && (
        <ManagePresetsDialog
          presets={presets}
          onRename={(id, name) => rename(id, name).catch(() => {})}
          onRemove={(id) => {
            if (id === presetId) setPresetId(null);
            remove(id).catch(() => {});
          }}
          onClose={() => setPresetDialog(null)}
        />
      )}
    </div>
  );
}

const toggle = tv({
  extend: focusRing,
  base: "flex items-center gap-1.5 self-start rounded-lg text-label font-semibold text-brand-strong cursor-default",
});

const parseOpen = (stored: unknown) =>
  Object.fromEntries(
    Object.entries(stored && typeof stored === "object" ? stored : {}).filter(([, open]) => open === true),
  ) as Record<string, boolean>;

/** "Pilihan lanjutan": closed at first, then open or closed as the user left it, per Tool. */
function MoreOptions({ tool, children }: { tool: ShippedTool; children: React.ReactNode }) {
  const { t } = useT();
  const [openTools, update] = useStoredState("rantakit.advancedOptions", parseOpen);
  const isOpen = openTools[tool] === true;
  return (
    <div className="flex flex-col gap-[22px] border-t border-border pt-5">
      <AriaButton
        aria-expanded={isOpen}
        onPress={() => update({ [tool]: !isOpen })}
        className={(renderProps) => toggle(renderProps)}
      >
        {t("options.advanced")}
        <ChevronRight aria-hidden className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </AriaButton>
      {isOpen && children}
    </div>
  );
}

const isFinished = (item: JobItem) => item.status !== "pending" && item.status !== "working";

/** How far the whole Task is, 0–1. */
function overall(items: JobItem[]) {
  const done = items.reduce(
    (sum, item) => sum + (isFinished(item) ? 1 : item.status === "working" ? item.fraction : 0),
    0,
  );
  return items.length > 0 ? done / items.length : 0;
}

/** Takes the main button's place while a Task runs. */
function Working({ label, fraction, onCancel }: { label: string; fraction: number; onCancel: () => void }) {
  const { t } = useT();
  return (
    <>
      <ProgressBar aria-label={label} value={fraction * 100} className="flex flex-col gap-2">
        {({ percentage }) => (
          <>
            <span aria-hidden className="text-label font-semibold">
              {label}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-badge-bg">
              <span className="block h-full rounded-full bg-brand-strong transition-[width]" style={{ width: `${percentage}%` }} />
            </span>
          </>
        )}
      </ProgressBar>
      <Button variant="secondary" onPress={onCancel}>
        {t("task.cancel")}
      </Button>
    </>
  );
}
