import { RadioCards } from "@/components/ui/RadioCards";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { pickImages } from "@/features/compress/imageApi";
import { NumberInput } from "@/features/tool/NumberInput";
import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import {
  convertTo,
  leavesUnchanged,
  toConvertOptions,
  useConvertSettings,
  type Background,
  type ConvertSettings,
  type PhotoFormat,
} from "./convertSettings";

function Main({ settings, onChange, files }: OptionsProps<ConvertSettings>) {
  const { t } = useT();
  return (
    <OptionField label={t("convert.to")}>
      <RadioCards<PhotoFormat>
        label={t("convert.to")}
        horizontal
        value={convertTo(settings, files)}
        options={[
          { id: "jpeg", label: "JPG" },
          { id: "png", label: "PNG" },
        ]}
        onChange={(to) => onChange({ to })}
      />
    </OptionField>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span aria-hidden className="size-4 shrink-0 rounded-full border border-border-strong" style={{ background: color }} />
  );
}

/** Only for JPG: PNG has no quality to choose and keeps its transparency. */
function Advanced({ settings, onChange }: OptionsProps<ConvertSettings>) {
  const { t } = useT();
  return (
    <>
      <OptionField label={t("convert.quality")} help={t("convert.quality.help")}>
        <NumberInput
          label={t("convert.quality")}
          minValue={1}
          maxValue={100}
          value={settings.quality}
          onChange={(quality) => onChange({ quality: quality === null ? 90 : Math.round(quality) })}
        />
      </OptionField>
      <OptionField label={t("convert.background")} help={t("convert.background.help")}>
        <ToggleButtonGroup
          aria-label={t("convert.background")}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[settings.background]}
          onSelectionChange={(keys) => onChange({ background: [...keys][0] as Background })}
          className="[&>*]:flex-auto [&>*]:gap-1.5 [&>*]:px-2"
        >
          <ToggleButton id="white">
            <Swatch color="#ffffff" /> {t("convert.background.white")}
          </ToggleButton>
          <ToggleButton id="black">
            <Swatch color="#000000" /> {t("convert.background.black")}
          </ToggleButton>
          <ToggleButton id="custom">
            <Swatch color={settings.customColor} /> {t("convert.background.custom")}
          </ToggleButton>
        </ToggleButtonGroup>
        {settings.background === "custom" && (
          <input
            type="color"
            aria-label={t("convert.background.custom")}
            value={settings.customColor}
            onChange={(event) => onChange({ customColor: event.target.value })}
            className="h-11 w-full cursor-default rounded-xl border border-border bg-surface px-1.5"
          />
        )}
      </OptionField>
    </>
  );
}

export const ubahFormatFoto = defineTool({
  noun: "photo",
  pick: pickImages,
  useSettings: useConvertSettings,
  Main,
  Advanced,
  showAdvanced: (settings, files) => convertTo(settings, files) === "jpeg",
  toRequest: toConvertOptions,
  leavesUnchanged,
});
