import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { Select, SelectItem } from "@/components/ui/Select";
import { pickPdfs } from "./pdfApi";
import { ShrinkOptions } from "./ShrinkOptions";
import { MAX_DIMENSIONS, toPdfOptions, usePdfSettings, type PdfSettings } from "./pdfSettings";

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
      <OptionField label={t("options.dimension")} description={t("options.dimension.pdf.hint")}>
        <Select
          aria-label={t("options.dimension")}
          value={String(settings.maxDimension)}
          onChange={(key) => onChange({ maxDimension: Number(key) })}
        >
          {MAX_DIMENSIONS.map((size) => (
            <SelectItem key={size} id={String(size)}>
              {size === 0 ? t("options.dimension.original") : t("options.dimension.px", { px: size })}
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
