import { ArrowLeft, ChevronRight } from "@keyline-icons/react";
import { Button as AriaButton } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import { JobView } from "@/features/compress/JobView";
import type { ToolOptions } from "@/features/compress/taskApi";
import type { CompressJob } from "@/features/compress/useCompressJob";
import { TOOL_ICONS } from "@/features/home/tools";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";
import { useStoredState } from "@/lib/storedState";
import { FilesColumn, NOUN_ICONS } from "./FilesColumn";
import { toolDef, type ShippedTool } from "./tools";

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
  const { t } = useT();
  const def = toolDef(tool);
  const [settings, update] = def.useSettings();
  const Icon = TOOL_ICONS[tool];
  const hasJob = job.items.length > 0;

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

      {hasJob ? (
        <JobView job={job} icon={NOUN_ICONS[def.noun]} formats={t(`formats.${def.noun}`)} onCompressMore={onProcessAnother} />
      ) : (
        <div className="flex flex-1 flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <section aria-label={t(`files.pick.${def.noun}`)} className="flex min-w-0 flex-1 flex-col">
            <FilesColumn noun={def.noun} paths={paths} onPick={onPick} onRemove={onRemove} />
          </section>

          <aside
            aria-label={t("options.label")}
            className="flex shrink-0 flex-col rounded-[20px] border border-border bg-surface lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:w-[380px]"
          >
            <div className="flex flex-col gap-[22px] overflow-y-auto p-5">
              <def.Main settings={settings} onChange={update} />
              {def.Advanced && (
                <MoreOptions tool={tool}>
                  <def.Advanced settings={settings} onChange={update} />
                </MoreOptions>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-border p-5">
              <Button isDisabled={paths.length === 0} onPress={() => onStart(def.toRequest(settings))}>
                {t(`main.${tool}`)}
              </Button>
              {paths.length === 0 && (
                <p className="text-center text-small text-text-muted">{t(`options.needFiles.${def.noun}`)}</p>
              )}
            </div>
          </aside>
        </div>
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
