import { Ban, ImageDown } from "lucide-react";
import type { DragState } from "@/lib/fileDrop";

interface DropOverlayProps {
  drag: DragState;
  /** A batch is running, so drops are ignored. */
  isBusy: boolean;
}

/** Full-window hint shown while files are dragged over the app. */
export function DropOverlay({ drag, isBusy }: DropOverlayProps) {
  const canDrop = !isBusy && drag.accepted > 0;
  const Icon = canDrop ? ImageDown : Ban;

  let message = `Lepaskan untuk menambahkan ${drag.accepted} gambar`;
  let detail = drag.accepted < drag.total ? `${drag.total - drag.accepted} berkas lain akan dilewati` : undefined;
  if (isBusy) {
    message = "Tunggu kompresi selesai";
    detail = undefined;
  } else if (drag.accepted === 0) {
    message = "Format tidak didukung";
    detail = "Hanya JPG dan PNG untuk saat ini";
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-50 flex p-3 bg-background/80 backdrop-blur-sm"
    >
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center ${
          canDrop ? "border-primary text-primary" : "border-border text-muted"
        }`}
      >
        <Icon aria-hidden className="size-10" />
        <p className="font-medium">{message}</p>
        {detail && <p className="text-sm text-muted">{detail}</p>}
      </div>
    </div>
  );
}
