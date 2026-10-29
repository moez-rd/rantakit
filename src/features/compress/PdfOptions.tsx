import { Slider } from "@/components/ui/Slider";
import { MaxDimensionSelect } from "./ImageOptions";
import type { PdfSettings } from "./pdfSettings";
import { OptionRow } from "./SetupView";

interface PdfOptionsProps {
  settings: PdfSettings;
  onChange: (patch: Partial<PdfSettings>) => void;
}

export function PdfOptions({ settings, onChange }: PdfOptionsProps) {
  return (
    <>
      <OptionRow
        label="Kualitas gambar"
        description="Untuk foto JPG di dalam PDF. Teks dan grafik tidak berubah."
      >
        <Slider
          aria-label="Kualitas gambar"
          className="sm:w-48"
          minValue={1}
          maxValue={100}
          value={settings.quality}
          onChange={(quality) => onChange({ quality })}
        />
      </OptionRow>

      <OptionRow label="Ukuran gambar" description="Batas sisi terpanjang foto di dalam PDF.">
        <MaxDimensionSelect
          label="Ukuran gambar"
          value={settings.maxDimension}
          onChange={(maxDimension) => onChange({ maxDimension })}
        />
      </OptionRow>
    </>
  );
}
