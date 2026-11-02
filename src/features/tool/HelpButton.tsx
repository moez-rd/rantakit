import { useId, useRef, useState } from "react";
import { Button } from "react-aria-components";
import { Popover } from "@/components/ui/Popover";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";

const button = tv({
  extend: focusRing,
  base: [
    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong",
    "text-[12px] leading-none font-bold text-text-muted cursor-default hover:text-text",
  ],
});

/**
 * The "?" after an option's label. Hovering, keyboard focus, or a tap shows a
 * short explanation; a second tap, moving away, or Escape hides it.
 */
export function HelpButton({ label, children }: { label: string; children: string }) {
  const { t } = useT();
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const pointer = useRef(false);
  const id = useId();

  return (
    <>
      <Button
        ref={ref}
        aria-label={t("options.help", { label })}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? id : undefined}
        className={(renderProps) => button(renderProps)}
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onPointerDown={() => (pointer.current = true)}
        onFocus={() => {
          // A tap focuses the button too; only keyboard focus opens it here.
          if (!pointer.current) setOpen(true);
          pointer.current = false;
        }}
        onBlur={() => setOpen(false)}
        onPress={(e) => setOpen((open) => (e.pointerType === "mouse" ? true : !open))}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation();
            setOpen(false);
          } else e.continuePropagation();
        }}
      >
        ?
      </Button>
      <Popover
        triggerRef={ref}
        isOpen={isOpen}
        onOpenChange={setOpen}
        isNonModal
        placement="top"
        showArrow
        className="max-w-72"
      >
        <p id={id} role="tooltip" className="p-3 text-small">
          {children}
        </p>
      </Popover>
    </>
  );
}
