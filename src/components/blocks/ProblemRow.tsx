import type { ComponentType } from "react";
import { CircleCheck, CircleStop, CircleX, TriangleAlert, type IconProps } from "@keyline-icons/react";
import { Button } from "@/components/ui/Button";
import { tv } from "@/lib/react-aria-utils";

/**
 * Red for a failed file, amber for a Size limit not reached, grey for a
 * cancelled file or one already as asked.
 */
export type ProblemTone = "failed" | "limit" | "cancelled" | "unchanged";

const TONE_ICON: Record<ProblemTone, ComponentType<IconProps>> = {
  failed: CircleX,
  limit: TriangleAlert,
  cancelled: CircleStop,
  unchanged: CircleCheck,
};

const row = tv({
  base: "flex items-center gap-4 px-4 py-3.5",
  variants: {
    tone: { failed: "bg-danger-soft", limit: "bg-warn-soft", cancelled: "", unchanged: "" },
  },
});

const message = tv({
  base: "flex items-start gap-2 text-small font-medium",
  variants: {
    tone: { failed: "text-danger", limit: "text-warn", cancelled: "text-text-muted", unchanged: "text-text-muted" },
  },
});

interface ProblemRowProps {
  name: string;
  title?: string;
  /** Stroke icon for the file's kind. */
  icon: ComponentType<IconProps>;
  tone: ProblemTone;
  message: string;
  /** "Coba lagi" for a failed file, "Ya, kecilkan" for a Size limit not reached. */
  action?: { label: string; onPress: () => void };
}

/** A file in the Result that did not succeed: an icon and a message, never color alone. */
export function ProblemRow({ name, title, icon: Icon, tone, message: text, action }: ProblemRowProps) {
  const ToneIcon = TONE_ICON[tone];
  return (
    <li className={row({ tone })}>
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-badge-bg text-text-muted"
      >
        <Icon className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-label" title={title}>
          {name}
        </span>
        <span className={message({ tone })}>
          <ToneIcon aria-hidden className="mt-px size-[18px] shrink-0" />
          {text}
        </span>
      </span>
      {action && (
        <Button variant="secondary" size="row" onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </li>
  );
}
