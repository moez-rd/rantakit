import type { ReactNode } from "react";
import { Image, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { Select, SelectItem } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { fileName } from "./imageApi";
import { MAX_DIMENSIONS, type ImageSettings, type OutputFormat, type SizeMode } from "./imageSettings";

interface ImageSetupViewProps {
  paths: string[];
  settings: ImageSettings;
  onSettingsChange: (patch: Partial<ImageSettings>) => void;
  onAddMore: () => void;
  onRemove: (path: string) => void;
  onCancel: () => void;
  onStart: () => void;
}

const DIMENSION_LABELS: Record<number, string> = {
  0: "Ukuran asli",
  3840: "3840 px (4K)",
  1920: "1920 px (Full HD)",
};

function OptionRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}

/** Review the picked images and choose how to compress them. */
export function ImageSetupView({
  paths,
  settings,
  onSettingsChange,
  onAddMore,
  onRemove,
  onCancel,
  onStart,
}: ImageSetupViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-medium">{paths.length} gambar dipilih</h1>
        <Button variant="secondary" onPress={onAddMore}>
          <Plus aria-hidden className="size-4" /> Tambah
        </Button>
      </div>

      <ul className="flex max-h-48 flex-col divide-y divide-border overflow-auto rounded-2xl border border-border bg-surface">
        {paths.map((path) => (
          <li key={path} className="flex items-center gap-3 py-1 ps-4 pe-2">
            <Image aria-hidden className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate text-sm" title={path}>
              {fileName(path)}
            </span>
            <Button variant="quiet" aria-label={`Hapus ${fileName(path)}`} onPress={() => onRemove(path)}>
              <X aria-hidden className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
        <OptionRow label="Kompres berdasarkan">
          <ToggleButtonGroup
            aria-label="Kompres berdasarkan"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[settings.mode]}
            onSelectionChange={(keys) => onSettingsChange({ mode: [...keys][0] as SizeMode })}
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
              onChange={(quality) => onSettingsChange({ quality })}
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
                if (!Number.isNaN(targetKb)) onSettingsChange({ targetKb: Math.round(targetKb) });
              }}
            />
          </OptionRow>
        )}

        <OptionRow label="Format hasil" description="PNG tidak mengurangi kualitas, tapi biasanya lebih besar.">
          <Select
            aria-label="Format hasil"
            className="sm:w-48"
            value={settings.format}
            onChange={(key) => onSettingsChange({ format: key as OutputFormat })}
          >
            <SelectItem id="same">Sama seperti asli</SelectItem>
            <SelectItem id="jpeg">JPG</SelectItem>
            <SelectItem id="png">PNG</SelectItem>
          </Select>
        </OptionRow>

        <OptionRow label="Ukuran gambar" description="Batas sisi terpanjang.">
          <Select
            aria-label="Ukuran gambar"
            className="sm:w-48"
            value={String(settings.maxDimension)}
            onChange={(key) => onSettingsChange({ maxDimension: Number(key) })}
          >
            {MAX_DIMENSIONS.map((size) => (
              <SelectItem key={size} id={String(size)}>
                {DIMENSION_LABELS[size] ?? `${size} px`}
              </SelectItem>
            ))}
          </Select>
        </OptionRow>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Batal
        </Button>
        <Button isDisabled={paths.length === 0} onPress={onStart}>
          Kompres {paths.length} gambar
        </Button>
      </div>
    </div>
  );
}
