import { NumberField } from "@/components/ui/NumberField";
import { Select, SelectItem } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { useT } from "@/i18n";
import { AdvancedOptions } from "./AdvancedOptions";
import { MAX_DIMENSIONS, type ImageSettings, type OutputFormat, type SizeMode } from "./imageSettings";
import { OptionRow } from "./SetupView";

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
    <Select aria-label={label} className="sm:w-48" value={String(value)} onChange={(key) => onChange(Number(key))}>
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

interface ImageOptionsProps {
  settings: ImageSettings;
  onChange: (patch: Partial<ImageSettings>) => void;
}

export function ImageOptions({ settings, onChange }: ImageOptionsProps) {
  const { t } = useT();
  return (
    <>
      <OptionRow label={t("options.format")} description={t("options.format.hint")}>
        <Select
          aria-label={t("options.format")}
          className="sm:w-48"
          value={settings.format}
          onChange={(key) => onChange({ format: key as OutputFormat })}
        >
          <SelectItem id="same">{t("options.format.same")}</SelectItem>
          <SelectItem id="jpeg">JPG</SelectItem>
          <SelectItem id="png">PNG</SelectItem>
        </Select>
      </OptionRow>

      <OptionRow label={t("options.limit")} description={t("options.limit.hint")}>
        <div className="flex flex-wrap items-center gap-3">
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
              className="w-32"
              minValue={10}
              step={10}
              value={settings.targetKb}
              formatOptions={{ style: "unit", unit: "kilobyte" }}
              onChange={(targetKb) => {
                if (!Number.isNaN(targetKb)) onChange({ targetKb: Math.round(targetKb) });
              }}
            />
          )}
        </div>
      </OptionRow>

      <AdvancedOptions>
        {settings.mode === "quality" && (
          <OptionRow label={t("options.quality")} description={t("options.quality.hint")}>
            <Slider
              aria-label={t("options.quality")}
              className="sm:w-48"
              minValue={1}
              maxValue={100}
              value={settings.quality}
              onChange={(quality) => onChange({ quality })}
            />
          </OptionRow>
        )}
        <OptionRow label={t("options.dimension")} description={t("options.dimension.hint")}>
          <MaxDimensionSelect
            label={t("options.dimension")}
            value={settings.maxDimension}
            onChange={(maxDimension) => onChange({ maxDimension })}
          />
        </OptionRow>
      </AdvancedOptions>
    </>
  );
}
