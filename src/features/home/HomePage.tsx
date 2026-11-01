import { FileArrowDown, ImageArrowDown } from "@keyline-icons/react/two-tone";
import { ToolCard } from "@/components/blocks/ToolCard";

interface HomePageProps {
  onCompressImage: () => void;
  onCompressPdf: () => void;
}

export function HomePage({ onCompressImage, onCompressPdf }: HomePageProps) {
  return (
    <div className="flex flex-1 flex-col gap-9 px-12 pt-10 pb-12">
      <h1 className="font-display text-title">Beranda</h1>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-x-4 gap-y-5">
        <li className="flex">
          <ToolCard
            name="Kompres Foto"
            description="Kecilkan ukuran file foto JPG dan PNG"
            icon={ImageArrowDown}
            onPress={onCompressImage}
          />
        </li>
        <li className="flex">
          <ToolCard
            name="Kompres PDF"
            description="Kecilkan ukuran file PDF"
            icon={FileArrowDown}
            onPress={onCompressPdf}
          />
        </li>
      </ul>
    </div>
  );
}
