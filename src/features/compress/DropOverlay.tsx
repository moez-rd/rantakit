import { FileArrowDown, FileX } from "@keyline-icons/react/two-tone";
import { useT } from "@/i18n";
import { FILE_KINDS, type DropPlan } from "./fileKinds";

interface DropOverlayProps {
  plan: DropPlan;
  /** A batch is running, so drops are ignored. */
  isBusy: boolean;
}

/** Full-window hint shown while files are dragged over the app. */
export function DropOverlay({ plan, isBusy }: DropOverlayProps) {
  const { t, count } = useT();
  const canDrop = !isBusy && plan.kind !== null;
  const Icon = canDrop ? FileArrowDown : FileX;

  let message: string;
  let detail: string | undefined;
  if (isBusy) {
    message = t("drop.busy");
  } else if (plan.kind === null) {
    message = t("drop.unsupported");
    detail = t("drop.accepted");
  } else {
    message = t("drop.add", { files: count(FILE_KINDS[plan.kind].files, plan.paths.length) });
    if (plan.skipped > 0) detail = t("drop.skipped", { count: plan.skipped });
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-50 flex bg-bg/80 p-3 backdrop-blur-sm"
    >
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center ${
          canDrop ? "border-brand-strong text-brand-strong" : "border-border text-text-muted"
        }`}
      >
        <Icon aria-hidden className="size-10" />
        <p className="font-medium">{message}</p>
        {detail && <p className="text-small text-text-muted">{detail}</p>}
      </div>
    </div>
  );
}
