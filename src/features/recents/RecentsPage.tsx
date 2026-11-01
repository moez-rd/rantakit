import { useCallback, useEffect, useState, type ReactNode } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { File, FolderOpen, History, Image, TriangleAlert, X } from "@keyline-icons/react";
import { DialogTrigger } from "react-aria-components";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fileName } from "@/features/compress/imageApi";
import { errorMessage } from "@/lib/errorMessages";
import { formatBytes, formatChange } from "@/lib/format";
import { clearHistory, listHistory, removeHistory, type HistoryItem } from "./historyApi";

const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function RecentsPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string>();

  const load = useCallback(() => {
    listHistory()
      .then((items) => {
        setItems(items);
        setError(undefined);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(load, [load]);

  const remove = (id: string) => {
    // Update right away; reload if the backend disagrees.
    setItems((prev) => prev?.filter((item) => item.id !== id) ?? null);
    removeHistory(id).catch(load);
  };

  const clear = () => {
    setItems([]);
    clearHistory().catch(load);
  };

  if (error) {
    return (
      <Message icon={TriangleAlert} title="Riwayat tidak bisa dibuka">
        {error}
      </Message>
    );
  }
  if (items === null) return null;
  if (items.length === 0) {
    return (
      <Message icon={History} title="Belum ada riwayat">
        Berkas yang kamu kompres akan muncul di sini.
      </Message>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-medium">Terbaru</h1>
        <DialogTrigger>
          <Button variant="secondary">Hapus semua</Button>
          <Modal>
            <AlertDialog
              title="Hapus semua riwayat?"
              variant="destructive"
              actionLabel="Hapus semua"
              cancelLabel="Batal"
              onAction={clear}
            >
              Daftar ini akan dikosongkan. Berkas hasil kompresi tidak ikut terhapus.
            </AlertDialog>
          </Modal>
        </DialogTrigger>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} onRemove={() => remove(item.id)} />
        ))}
      </ul>
    </div>
  );
}

function HistoryRow({ item, onRemove }: { item: HistoryItem; onRemove: () => void }) {
  const smaller = item.compressedBytes < item.originalBytes;
  const Icon = item.format === "pdf" ? File : Image;

  return (
    <li className="flex items-center gap-3 py-3 ps-4 pe-2">
      <Icon aria-hidden className={`size-5 shrink-0 ${item.outputExists ? "text-text-muted" : "text-border"}`} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-small font-medium ${item.outputExists ? "" : "text-text-muted line-through"}`}
          title={item.outputPath}
        >
          {fileName(item.outputPath)}
        </p>
        <p className="truncate text-small text-text-muted">
          {item.outputExists ? (
            <>
              {formatBytes(item.originalBytes)} → {formatBytes(item.compressedBytes)}{" "}
              <span className={smaller ? "text-success" : "text-warn"}>
                {formatChange(item.originalBytes, item.compressedBytes)}
              </span>
            </>
          ) : (
            "Berkas tidak ditemukan"
          )}
          {" · "}
          {dateTime.format(item.createdAt)}
        </p>
      </div>
      {item.outputExists && (
        <Button
          variant="quiet"
          aria-label="Tampilkan di folder"
          onPress={() => revealItemInDir(item.outputPath)}
        >
          <FolderOpen aria-hidden className="size-5" />
        </Button>
      )}
      <Button variant="quiet" aria-label="Hapus dari riwayat" onPress={onRemove}>
        <X aria-hidden className="size-5" />
      </Button>
    </li>
  );
}

function Message({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof History;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon aria-hidden className="size-8 text-text-muted" />
      <h1 className="font-medium">{title}</h1>
      <p className="max-w-xs text-small text-text-muted">{children}</p>
    </div>
  );
}
