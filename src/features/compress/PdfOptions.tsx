import { Slider } from "@/components/ui/Slider";
import { useT } from "@/i18n";
import { AdvancedOptions } from "./AdvancedOptions";
import { MaxDimensionSelect } from "./ImageOptions";
import type { PdfSettings } from "./pdfSettings";
import { OptionRow } from "./SetupView";

interface PdfOptionsProps {
  settings: PdfSettings;
  onChange: (patch: Partial<PdfSettings>) => void;
}

export function PdfOptions({ settings, onChange }: PdfOptionsProps) {
  const { t } = useT();
  return (
    <>
      <p className="px-4 py-4 text-text-muted">{t("options.pdf.intro")}</p>

      <AdvancedOptions>
        <OptionRow label={t("options.quality.pdf")} description={t("options.quality.pdf.hint")}>
          <Slider
            aria-label={t("options.quality.pdf")}
            className="sm:w-48"
            minValue={1}
            maxValue={100}
            value={settings.quality}
            onChange={(quality) => onChange({ quality })}
          />
        </OptionRow>
        <OptionRow label={t("options.dimension")} description={t("options.dimension.pdf.hint")}>
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
