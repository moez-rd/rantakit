import { FileArrowDown, FileX } from "@keyline-icons/react/two-tone";

interface DropOverlayProps {
  /** Whether letting go will do something. */
  canDrop: boolean;
  title: string;
  detail?: string;
}

/** Full-window hint shown while files are dragged over the app. */
export function DropOverlay({ canDrop, title, detail }: DropOverlayProps) {
  const Icon = canDrop ? FileArrowDown : FileX;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 flex bg-bg/90 p-4">
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed p-6 text-center ${
          canDrop ? "border-brand-strong" : "border-text-disabled"
        }`}
      >
        <span
          className={`flex size-22 items-center justify-center rounded-3xl ${
            canDrop ? "bg-brand-soft text-brand-strong" : "bg-badge-bg text-text-muted"
          }`}
        >
          <Icon aria-hidden className="size-11" />
        </span>
        <p className="font-display text-title">{title}</p>
        {detail && <p className="text-text-muted">{detail}</p>}
      </div>
    </div>
  );
}
