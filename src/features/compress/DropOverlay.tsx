import { Ban, FileDown } from "lucide-react";
import { FILE_KINDS, type DropPlan } from "./fileKinds";

interface DropOverlayProps {
  plan: DropPlan;
  /** A batch is running, so drops are ignored. */
  isBusy: boolean;
}

/** Full-window hint shown while files are dragged over the app. */
export function DropOverlay({ plan, isBusy }: DropOverlayProps) {
  const canDrop = !isBusy && plan.kind !== null;
  const Icon = canDrop ? FileDown : Ban;

  let message: string;
  let detail: string | undefined;
  if (isBusy) {
    message = "Tunggu kompresi selesai";
  } else if (plan.kind === null) {
    message = "Format tidak didukung";
    detail = "Hanya JPG, PNG, dan PDF untuk saat ini";
  } else {
    message = `Lepaskan untuk menambahkan ${plan.paths.length} ${FILE_KINDS[plan.kind].noun}`;
    if (plan.skipped > 0) detail = `${plan.skipped} berkas lain akan dilewati`;
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
