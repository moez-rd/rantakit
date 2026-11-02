import { NumberField } from "react-aria-components";
import { FieldGroup, Input } from "@/components/ui/Field";

interface NumberInputProps {
  label: string;
  /** Null while the field is empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
  className?: string;
}

/** A plain number box that may be left empty; empty means "let Rantakit choose". */
export function NumberInput({ label, value, onChange, minValue, maxValue, placeholder, className }: NumberInputProps) {
  return (
    <NumberField
      aria-label={label}
      className={`min-w-0 ${className ?? ""}`}
      minValue={minValue}
      maxValue={maxValue}
      value={value ?? NaN}
      formatOptions={{ maximumFractionDigits: 1, useGrouping: false }}
      onChange={(next) => onChange(Number.isNaN(next) ? null : next)}
    >
      <FieldGroup className="h-11">
        <Input placeholder={placeholder} className="min-h-11 w-full" />
      </FieldGroup>
    </NumberField>
  );
}
