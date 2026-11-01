import { Select, SelectItem } from "@/components/ui/Select";
import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { pickImages } from "./imageApi";
import {
  MAX_DIMENSIONS,
  toImageOptions,
  useImageSettings,
  type ImageSettings,
  type OutputFormat,
} from "./imageSettings";
import { ShrinkOptions } from "./ShrinkOptions";

const DIMENSION_NOTES: Record<number, string> = { 3840: " (4K)", 1920: " (Full HD)" };

export function MaxDimensionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useT();
  return (
    <Select aria-label={label} value={String(value)} onChange={(key) => onChange(Number(key))}>
      {MAX_DIMENSIONS.map((size) => (
        <SelectItem key={size} id={String(size)}>
          {size === 0
            ? t("options.dimension.original")
            : t("options.dimension.px", { px: size }) + (DIMENSION_NOTES[size] ?? "")}
        </SelectItem>
      ))}
    </Select>
  );
}

function Main({ settings, onChange }: OptionsProps<ImageSettings>) {
  return <ShrinkOptions noun="photo" settings={settings} onChange={onChange} />;
}

function Advanced({ settings, onChange }: OptionsProps<ImageSettings>) {
  const { t } = useT();
  return (
    <>
      <OptionField label={t("options.format")} description={t("options.format.hint")}>
        <Select
          aria-label={t("options.format")}
          value={settings.format}
          onChange={(key) => onChange({ format: key as OutputFormat })}
        >
          <SelectItem id="same">{t("options.format.same")}</SelectItem>
          <SelectItem id="jpeg">JPG</SelectItem>
          <SelectItem id="png">PNG</SelectItem>
        </Select>
      </OptionField>
      <OptionField label={t("options.dimension")} help={t("options.dimension.help")} description={t("options.dimension.hint")}>
        <MaxDimensionSelect
          label={t("options.dimension")}
          value={settings.maxDimension}
          onChange={(maxDimension) => onChange({ maxDimension })}
        />
      </OptionField>
    </>
  );
}

export const kompresFoto = defineTool({
  noun: "photo",
  pick: pickImages,
  useSettings: useImageSettings,
  Main,
  Advanced,
  toRequest: toImageOptions,
});
