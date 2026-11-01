import { FileText, Image, type LucideIcon } from "lucide-react";
import { Button } from "react-aria-components";
import { focusRing, tv } from "@/lib/react-aria-utils";

const card = tv({
  extend: focusRing,
  base: [
    "flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left",
    "cursor-default select-none transition [-webkit-tap-highlight-color:transparent]",
    "hovered:border-brand pressed:scale-[0.99]",
  ],
});

interface CompressCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress?: () => void;
}

function CompressCard({ icon: Icon, title, description, onPress }: CompressCardProps) {
  return (
    <Button onPress={onPress} className={(renderProps) => card(renderProps)}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
        <Icon aria-hidden className="size-6" />
      </span>
      <span className="flex flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-small text-text-muted">{description}</span>
      </span>
    </Button>
  );
}

interface HomePageProps {
  onCompressImage: () => void;
  onCompressPdf: () => void;
}

export function HomePage({ onCompressImage, onCompressPdf }: HomePageProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <CompressCard
          icon={Image}
          title="Kompres gambar"
          description="JPG dan PNG"
          onPress={onCompressImage}
        />
        <CompressCard
          icon={FileText}
          title="Kompres PDF"
          description="Dokumen PDF"
          onPress={onCompressPdf}
        />
      </div>
      <p className="hidden text-small text-text-muted pointer-fine:block">atau seret berkas ke sini</p>
    </div>
  );
}
