import type { ReactNode } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { composeTailwindRenderProps, focusRing, tv } from "@/lib/react-aria-utils";

const track = tv({
  extend: focusRing,
  base: "flex h-6 w-10 shrink-0 cursor-default items-center rounded-full border border-transparent px-0.5 transition duration-200 ease-in-out",
  variants: {
    isSelected: {
      false: "bg-control",
      true: "bg-brand-strong forced-colors:bg-[Highlight]!",
    },
    isDisabled: { true: "bg-badge-bg" },
  },
});

const handle = tv({
  base: "size-4.5 rounded-full bg-surface shadow-xs transition duration-200 ease-in-out",
  variants: {
    isSelected: { false: "translate-x-0", true: "translate-x-4 rtl:-translate-x-4" },
  },
});

export interface SwitchProps extends Omit<AriaSwitchProps, "children"> {
  children?: ReactNode;
}

/** An on/off setting that applies at once. */
export function Switch({ children, ...props }: SwitchProps) {
  return (
    <AriaSwitch
      {...props}
      className={composeTailwindRenderProps(props.className, "group flex items-center gap-3 text-label")}
    >
      {(renderProps) => (
        <>
          <div className={track(renderProps)}>
            <span className={handle(renderProps)} />
          </div>
          {children}
        </>
      )}
    </AriaSwitch>
  );
}
