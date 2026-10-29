import { NumberField } from "@/components/ui/NumberField";
import { Select, SelectItem } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { MAX_DIMENSIONS, type ImageSettings, type OutputFormat, type SizeMode } from "./imageSettings";
import { OptionRow } from "./SetupView";

const DIMENSION_LABELS: Record<number, string> = {
  0: "Ukuran asli",
  3840: "3840 px (4K)",
  1920: "1920 px (Full HD)",
};

export function MaxDimensionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Select aria-label={label} className="sm:w-48" value={String(value)} onChange={(key) => onChange(Number(key))}>
      {MAX_DIMENSIONS.map((size) => (
        <SelectItem key={size} id={String(size)}>
          {DIMENSION_LABELS[size] ?? `${size} px`}
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
  return (
    <>
      <OptionRow label="Kompres berdasarkan">
        <ToggleButtonGroup
          aria-label="Kompres berdasarkan"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[settings.mode]}
          onSelectionChange={(keys) => onChange({ mode: [...keys][0] as SizeMode })}
        >
          <ToggleButton id="quality">Kualitas</ToggleButton>
          <ToggleButton id="target">Ukuran target</ToggleButton>
        </ToggleButtonGroup>
      </OptionRow>

      {settings.mode === "quality" ? (
        <OptionRow label="Kualitas" description="Makin rendah, makin kecil. Tidak berlaku untuk PNG.">
          <Slider
            aria-label="Kualitas"
            className="sm:w-48"
            minValue={1}
            maxValue={100}
            value={settings.quality}
            onChange={(quality) => onChange({ quality })}
          />
        </OptionRow>
      ) : (
        <OptionRow label="Ukuran maksimal" description="Batas untuk tiap gambar.">
          <NumberField
            aria-label="Ukuran maksimal"
            minValue={10}
            step={10}
            value={settings.targetKb}
            formatOptions={{ style: "unit", unit: "kilobyte" }}
            onChange={(targetKb) => {
              if (!Number.isNaN(targetKb)) onChange({ targetKb: Math.round(targetKb) });
            }}
          />
        </OptionRow>
      )}

      <OptionRow label="Format hasil" description="PNG tidak mengurangi kualitas, tapi biasanya lebih besar.">
        <Select
          aria-label="Format hasil"
          className="sm:w-48"
          value={settings.format}
          onChange={(key) => onChange({ format: key as OutputFormat })}
        >
          <SelectItem id="same">Sama seperti asli</SelectItem>
          <SelectItem id="jpeg">JPG</SelectItem>
          <SelectItem id="png">PNG</SelectItem>
        </Select>
      </OptionRow>

      <OptionRow label="Ukuran gambar" description="Batas sisi terpanjang.">
        <MaxDimensionSelect
          label="Ukuran gambar"
          value={settings.maxDimension}
          onChange={(maxDimension) => onChange({ maxDimension })}
        />
      </OptionRow>
    </>
  );
}
