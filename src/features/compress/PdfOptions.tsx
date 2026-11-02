import { Select, SelectItem } from "@/components/ui/Select";
import { NumberInput } from "@/features/tool/NumberInput";
import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { pickPdfs } from "./pdfApi";
import { MAX_DPIS, toPdfOptions, usePdfSettings, type PdfSettings } from "./pdfSettings";
import { ShrinkOptions } from "./ShrinkOptions";

function Main({ settings, onChange }: OptionsProps<PdfSettings>) {
  const { t } = useT();
  return (
    <>
      <ShrinkOptions noun="pdf" settings={settings} onChange={onChange} />
      <p className="text-small text-text-muted">{t("options.pdf.intro")}</p>
    </>
  );
}

function Advanced({ settings, onChange }: OptionsProps<PdfSettings>) {
  const { t } = useT();
  return (
    <>
      <OptionField
        label={t("options.quality.pdf")}
        help={t("options.quality.pdf.help")}
        description={t("options.quality.overrides")}
      >
        <NumberInput
          label={t("options.quality.pdf")}
          minValue={1}
          maxValue={100}
          placeholder={t("options.quality.auto")}
          value={settings.quality}
          onChange={(quality) => onChange({ quality: quality === null ? null : Math.round(quality) })}
        />
      </OptionField>
      <OptionField label={t("options.dpi")} help={t("options.dpi.help")}>
        <Select
          aria-label={t("options.dpi")}
          value={String(settings.maxDpi)}
          onChange={(key) => onChange({ maxDpi: Number(key) })}
        >
          {MAX_DPIS.map((dpi) => (
            <SelectItem key={dpi} id={String(dpi)}>
              {dpi === 0 ? t("options.dimension.original") : `${dpi} dpi`}
            </SelectItem>
          ))}
        </Select>
      </OptionField>
    </>
  );
}

export const kompresPdf = defineTool({
  noun: "pdf",
  pick: pickPdfs,
  useSettings: usePdfSettings,
  Main,
  Advanced,
  toRequest: toPdfOptions,
});
