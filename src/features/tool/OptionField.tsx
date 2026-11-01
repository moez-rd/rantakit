import type { ReactNode } from "react";
import { HelpButton } from "./HelpButton";

interface OptionFieldProps {
  label: string;
  /** Plain words for an option whose name needs explaining; adds a "?" after the label. */
  help?: string;
  /** A line under the control. */
  description?: string;
  children: ReactNode;
}

/** One option in the Options column: its label, the control, and a hint under it. */
export function OptionField({ label, help, description, children }: OptionFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-label font-semibold">{label}</span>
        {help && <HelpButton label={label}>{help}</HelpButton>}
      </div>
      {children}
      {description && <p className="text-small text-text-muted">{description}</p>}
    </div>
  );
}
