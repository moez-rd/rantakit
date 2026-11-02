import { Select, SelectItem } from "@/components/ui/Select";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { NumberInput } from "@/features/tool/NumberInput";
import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { pickImages } from "./imageApi";
import {
  PHOTO_SIZES,
  toImageOptions,
  useImageSettings,
  type ImageSettings,
  type OutputFormat,
  type PhotoSize,
} from "./imageSettings";
import { ShrinkOptions } from "./ShrinkOptions";

function Main({ settings, onChange }: OptionsProps<ImageSettings>) {
  return <ShrinkOptions noun="photo" settings={settings} onChange={onChange} />;
}

function Advanced({ settings, onChange }: OptionsProps<ImageSettings>) {
  const { t } = useT();
  return (
    <>
      <OptionField label={t("options.format")}>
        <ToggleButtonGroup
          aria-label={t("options.format")}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[settings.format]}
          onSelectionChange={(keys) => onChange({ format: [...keys][0] as OutputFormat })}
          className="[&>*]:flex-1"
        >
          <ToggleButton id="same">{t("options.format.same")}</ToggleButton>
          <ToggleButton id="jpeg">JPG</ToggleButton>
          <ToggleButton id="png">PNG</ToggleButton>
        </ToggleButtonGroup>
      </OptionField>
      <OptionField label={t("options.dimension")} help={t("options.dimension.help")}>
        <Select
          aria-label={t("options.dimension")}
          value={settings.size}
          onChange={(key) => onChange({ size: key as ImageSettings["size"] })}
        >
          <SelectItem id="original">{t("options.dimension.original")}</SelectItem>
          {(Object.keys(PHOTO_SIZES) as PhotoSize[]).map((size) => (
            <SelectItem key={size} id={size}>
              {t(`photoSize.${size}`)}
            </SelectItem>
          ))}
        </Select>
      </OptionField>
      <OptionField
        label={t("options.quality")}
        help={t("options.quality.help")}
        description={t("options.quality.overrides")}
      >
        <NumberInput
          label={t("options.quality")}
          minValue={1}
          maxValue={100}
          placeholder={t("options.quality.auto")}
          value={settings.quality}
          onChange={(quality) => onChange({ quality: quality === null ? null : Math.round(quality) })}
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
