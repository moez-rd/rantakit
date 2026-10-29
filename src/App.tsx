import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/navigation";
import { DropOverlay } from "@/features/compress/DropOverlay";
import { FILE_KINDS, planDrop, type FileKind } from "@/features/compress/fileKinds";
import { compressImage } from "@/features/compress/imageApi";
import { ImageOptions } from "@/features/compress/ImageOptions";
import { toImageRequest, useImageSettings } from "@/features/compress/imageSettings";
import { JobView } from "@/features/compress/JobView";
import { compressPdf } from "@/features/compress/pdfApi";
import { PdfOptions } from "@/features/compress/PdfOptions";
import { toPdfRequest, usePdfSettings } from "@/features/compress/pdfSettings";
import { SetupView } from "@/features/compress/SetupView";
import { useCompressJob } from "@/features/compress/useCompressJob";
import { HomePage } from "@/features/home/HomePage";
import { RecentsPage } from "@/features/recents/RecentsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { hasSettingsWindow, openSettingsWindow } from "@/features/settings/settingsWindow";
import { useFileDrop } from "@/lib/fileDrop";
import { useMenuEvents } from "@/lib/menuEvents";

/** Picked files waiting for the user to choose settings. */
interface Selection {
  kind: FileKind;
  paths: string[];
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const job = useCompressJob();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [imageSettings, updateImageSettings] = useImageSettings();
  const [pdfSettings, updatePdfSettings] = usePdfSettings();

  const navigate = (next: Page) => {
    if (next === "settings" && hasSettingsWindow) {
      openSettingsWindow();
    } else {
      setPage(next);
    }
  };

  /** Add files to the selection and show the settings, from a picker or a drop. */
  const addFiles = (kind: FileKind, paths: string[]) => {
    if (job.isRunning || paths.length === 0) return;
    job.clear();
    // Files of another kind start a new selection; a batch holds one kind.
    setSelection((prev) => ({
      kind,
      paths: prev?.kind === kind ? [...new Set([...prev.paths, ...paths])] : paths,
    }));
    setPage("home");
  };

  const pickFiles = async (kind: FileKind) => {
    if (job.isRunning) return;
    addFiles(kind, await FILE_KINDS[kind].pick());
  };

  const startJob = () => {
    if (!selection) return;
    const { kind, paths } = selection;
    job.start(kind, paths, (path) =>
      kind === "image"
        ? compressImage(toImageRequest(path, imageSettings))
        : compressPdf(toPdfRequest(path, pdfSettings)),
    );
    setSelection(null);
  };

  const dragging = useFileDrop((paths) => {
    const plan = planDrop(paths, selection?.kind ?? null);
    if (plan.kind) addFiles(plan.kind, plan.paths);
  });

  useMenuEvents((id) => {
    switch (id) {
      case "go_home":
        return navigate("home");
      case "go_recents":
        return navigate("recents");
      case "open_settings":
        return navigate("settings");
      case "compress_image":
        return pickFiles("image");
      case "compress_pdf":
        return pickFiles("pdf");
    }
  });

  const homeView = () => {
    if (job.items.length > 0) {
      return <JobView job={job} onCompressMore={() => pickFiles(job.kind)} />;
    }
    if (selection && selection.paths.length > 0) {
      const { kind, paths } = selection;
      return (
        <SetupView
          kind={kind}
          paths={paths}
          onAddMore={() => pickFiles(kind)}
          onRemove={(path) => setSelection({ kind, paths: paths.filter((p) => p !== path) })}
          onCancel={() => setSelection(null)}
          onStart={startJob}
        >
          {kind === "image" ? (
            <ImageOptions settings={imageSettings} onChange={updateImageSettings} />
          ) : (
            <PdfOptions settings={pdfSettings} onChange={updatePdfSettings} />
          )}
        </SetupView>
      );
    }
    return <HomePage onCompressImage={() => pickFiles("image")} onCompressPdf={() => pickFiles("pdf")} />;
  };

  return (
    <AppShell page={page} onNavigate={navigate}>
      {page === "home" && homeView()}
      {page === "recents" && <RecentsPage />}
      {page === "settings" && <SettingsPage />}
      {dragging && (
        <DropOverlay plan={planDrop(dragging, selection?.kind ?? null)} isBusy={job.isRunning} />
      )}
    </AppShell>
  );
}

export default App;
