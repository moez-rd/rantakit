import { Slider } from "@/components/ui/Slider";
import { OptionField } from "@/features/tool/OptionField";
import { defineTool, type OptionsProps } from "@/features/tool/toolDef";
import { useT } from "@/i18n";
import { MaxDimensionSelect } from "./ImageOptions";
import { pickPdfs } from "./pdfApi";
import { toPdfOptions, usePdfSettings, type PdfSettings } from "./pdfSettings";

function Main() {
  const { t } = useT();
  return <p className="text-text-muted">{t("options.pdf.intro")}</p>;
}

function Advanced({ settings, onChange }: OptionsProps<PdfSettings>) {
  const { t } = useT();
  return (
    <>
      <OptionField label={t("options.quality.pdf")} help={t("options.quality.pdf.help")} description={t("options.quality.pdf.hint")}>
        <Slider
          aria-label={t("options.quality.pdf")}
          minValue={1}
          maxValue={100}
          value={settings.quality}
          onChange={(quality) => onChange({ quality })}
        />
      </OptionField>
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
