import { Pen } from "@keyline-icons/react";
import { Select, SelectItem } from "@/components/ui/Select";
import { OptionField } from "@/features/tool/OptionField";
import { useT } from "@/i18n";
import type { Preset } from "./presetsApi";

const NONE = "none";
const MANAGE = "manage";

interface PresetPickerProps {
  presets: Preset[];
  /** The Preset whose options are in use; null for "Tanpa preset". */
  selected: string | null;
  onSelect: (preset: Preset | null) => void;
  onManage: () => void;
}

/** The top of every Tool's Options: "Tanpa preset", the Tool's Presets, then "Kelola preset". */
export function PresetPicker({ presets, selected, onSelect, onManage }: PresetPickerProps) {
  const { t } = useT();
  return (
    <OptionField label={t("preset.label")}>
      <Select
        aria-label={t("preset.label")}
        value={selected ?? NONE}
        onChange={(key) => {
          if (key === MANAGE) return onManage();
          onSelect(presets.find((preset) => preset.id === key) ?? null);
        }}
      >
        <SelectItem id={NONE}>{t("preset.none")}</SelectItem>
        {presets.map((preset) => (
          <SelectItem key={preset.id} id={preset.id}>
            {preset.name}
          </SelectItem>
        ))}
        {presets.length > 0 && (
          <SelectItem id={MANAGE} textValue={t("preset.manage")}>
            <Pen aria-hidden className="size-4 text-text-muted" /> {t("preset.manage")}
          </SelectItem>
        )}
      </Select>
    </OptionField>
  );
}
