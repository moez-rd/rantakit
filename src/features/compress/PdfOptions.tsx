import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { MaxDimensionSelect } from "./ImageOptions";
import { pickPdfs } from "./pdfApi";
import { ShrinkOptions } from "./ShrinkOptions";
import { toPdfOptions, usePdfSettings, type PdfSettings } from "./pdfSettings";

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
        <MaxDimensionSelect
          label={t("options.dimension")}
          value={settings.maxDimension}
          onChange={(maxDimension) => onChange({ maxDimension })}
        />
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
