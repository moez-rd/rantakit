import { RadioButton, RadioField, RadioGroup } from "react-aria-components/RadioGroup";
import { focusRing, tv } from "@/lib/react-aria-utils";

const card = tv({
  extend: focusRing,
  base: "flex w-full cursor-default items-start gap-3 rounded-[14px] border px-3.5 py-3 text-start transition-colors",
  variants: {
    isSelected: {
      false: "border-border bg-surface hover:border-border-strong",
      true: "border-brand-strong bg-brand-soft",
    },
    isDisabled: { true: "text-text-disabled" },
  },
});

const dot = tv({
  base: "mt-0.5 size-4.5 shrink-0 rounded-full border bg-surface transition-all",
  variants: {
    isSelected: {
      false: "border-control",
      true: "border-[calc(var(--spacing)*1.5)] border-brand-strong forced-colors:border-[Highlight]!",
    },
  },
});

export interface RadioCardOption<K extends string> {
  id: K;
  label: string;
  /** One line under the label. */
  description?: string;
}

interface RadioCardsProps<K extends string> {
  label: string;
  value: K;
  options: RadioCardOption<K>[];
  onChange: (value: K) => void;
  /** Lay the cards out side by side instead of one under another. */
  horizontal?: boolean;
}

/** A choice of a few plain-worded options, each a card with an optional line under its name. */
export function RadioCards<K extends string>({ label, value, options, onChange, horizontal }: RadioCardsProps<K>) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onChange={(next) => onChange(next as K)}
      orientation={horizontal ? "horizontal" : "vertical"}
      className={horizontal ? "flex gap-2" : "flex flex-col gap-2"}
    >
      {options.map((option) => (
        <RadioField key={option.id} value={option.id} className={horizontal ? "flex-1" : undefined}>
          <RadioButton className={(renderProps) => card(renderProps)}>
            {({ isSelected }) => (
              <>
                <span aria-hidden className={dot({ isSelected })} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-label font-semibold">{option.label}</span>
                  {option.description && <span className="text-small text-text-muted">{option.description}</span>}
                </span>
              </>
            )}
          </RadioButton>
        </RadioField>
      ))}
    </RadioGroup>
  );
}
