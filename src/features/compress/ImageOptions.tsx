import { NumberField } from "@/components/ui/NumberField";
import { Select, SelectItem } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
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
  type SizeMode,
} from "./imageSettings";

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
  const { t } = useT();
  return (
    <OptionField label={t("options.limit")} description={t("options.limit.hint")}>
      <ToggleButtonGroup
        aria-label={t("options.limit")}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[settings.mode]}
        onSelectionChange={(keys) => onChange({ mode: [...keys][0] as SizeMode })}
      >
        <ToggleButton id="quality">{t("options.limit.none")}</ToggleButton>
        <ToggleButton id="target">{t("options.limit.set")}</ToggleButton>
      </ToggleButtonGroup>
      {settings.mode === "target" && (
        <NumberField
          aria-label={t("options.limit.value")}
          minValue={10}
          step={10}
          value={settings.targetKb}
          formatOptions={{ style: "unit", unit: "kilobyte" }}
          onChange={(targetKb) => {
            if (!Number.isNaN(targetKb)) onChange({ targetKb: Math.round(targetKb) });
          }}
        />
      )}
    </OptionField>
  );
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
      {settings.mode === "quality" && (
        <OptionField label={t("options.quality")} help={t("options.quality.help")} description={t("options.quality.hint")}>
          <Slider
            aria-label={t("options.quality")}
            minValue={1}
            maxValue={100}
            value={settings.quality}
            onChange={(quality) => onChange({ quality })}
          />
        </OptionField>
      )}
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
