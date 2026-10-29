import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FILE_KINDS, type FileKind } from "./fileKinds";
import { fileName } from "./imageApi";

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
  const { noun, icon: Icon } = FILE_KINDS[kind];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-medium">
          {paths.length} {noun} dipilih
        </h1>
        <Button variant="secondary" onPress={onAddMore}>
          <Plus aria-hidden className="size-4" /> Tambah
        </Button>
      </div>

      <ul className="flex max-h-48 flex-col divide-y divide-border overflow-auto rounded-2xl border border-border bg-surface">
        {paths.map((path) => (
          <li key={path} className="flex items-center gap-3 py-1 ps-4 pe-2">
            <Icon aria-hidden className="size-4 shrink-0 text-muted" />
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
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}
