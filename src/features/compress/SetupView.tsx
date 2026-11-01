import type { ReactNode } from "react";
import { Plus } from "@keyline-icons/react";
import { FileRow } from "@/components/blocks/FileRow";
import { Button } from "@/components/ui/Button";
import { FILE_KINDS, type FileKind } from "./fileKinds";
import { fileName } from "./imageApi";
import { formatBytes } from "@/lib/format";
import { useFileSizes } from "./useFileSizes";

interface SetupViewProps {
  kind: FileKind;
  paths: string[];
  /** The option rows for this kind. */
  children: ReactNode;
  onAddMore: () => void;
  onRemove: (path: string) => void;
  onCancel: () => void;
  onStart: () => void;
}

/** Review the picked files and choose how to compress them. */
export function SetupView({ kind, paths, children, onAddMore, onRemove, onCancel, onStart }: SetupViewProps) {
  const { noun, icon } = FILE_KINDS[kind];
  const sizes = useFileSizes(paths);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-12 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-section">
          {paths.length} {noun} dipilih
        </h1>
        <Button variant="secondary" size="row" onPress={onAddMore}>
          <Plus aria-hidden className="size-5" /> Tambah
        </Button>
      </div>

      <ul className="flex max-h-72 flex-col divide-y divide-border overflow-auto rounded-2xl border border-border bg-surface">
        {paths.map((path) => (
          <FileRow
            key={path}
            name={fileName(path)}
            title={path}
            icon={icon}
            status="ready"
            note={path in sizes ? formatBytes(sizes[path]) : ""}
            onRemove={() => onRemove(path)}
            removeLabel={`Hapus ${fileName(path)} dari daftar`}
          />
        ))}
      </ul>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
        {children}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Batal
        </Button>
        <Button isDisabled={paths.length === 0} onPress={onStart}>
          Kompres {paths.length} {noun}
        </Button>
      </div>
    </div>
  );
}

export function OptionRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col">
        <span className="text-label">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}
