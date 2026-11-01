import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/navigation";
import { DropOverlay } from "@/features/compress/DropOverlay";
import { FILE_KINDS, planDrop, type FileKind } from "@/features/compress/fileKinds";
import { ImageOptions } from "@/features/compress/ImageOptions";
import { toImageOptions, useImageSettings } from "@/features/compress/imageSettings";
import { JobView } from "@/features/compress/JobView";
import { PdfOptions } from "@/features/compress/PdfOptions";
import { toPdfOptions, usePdfSettings } from "@/features/compress/pdfSettings";
import { SetupView } from "@/features/compress/SetupView";
import { useCompressJob } from "@/features/compress/useCompressJob";
import { HomePage } from "@/features/home/HomePage";
import type { ToolId } from "@/features/home/tools";
import { RecentsPage } from "@/features/recents/RecentsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import {
  hasSettingsWindow,
  openSettingsWindow,
  type SettingsTab,
} from "@/features/settings/settingsWindow";
import { useShortcuts, type AppCommand } from "@/lib/appCommands";
import { useFileDrop } from "@/lib/fileDrop";
import { LICENSE_URL, openExternal, SOURCE_URL } from "@/lib/links";
import { useMenuEvents, useMenuLanguage } from "@/lib/menuEvents";
import { isMacApp } from "@/lib/platform";

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

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");

  const navigate = (next: Page) => openPage(next, "general");

  const openPage = (next: Page, tab: SettingsTab) => {
    if (next === "settings" && hasSettingsWindow) {
      openSettingsWindow(tab);
    } else {
      if (next === "settings") setSettingsTab(tab);
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

  /** Shipped Tools open the file picker; coming soon Tools can't be pressed. */
  const openTool = (id: ToolId) => {
    if (id === "kompres-foto") pickFiles("image");
    else if (id === "kompres-pdf") pickFiles("pdf");
  };

  const startJob = () => {
    if (!selection) return;
    const { kind, paths } = selection;
    job.start(kind, paths, kind === "image" ? toImageOptions(imageSettings) : toPdfOptions(pdfSettings));
    setSelection(null);
  };

  const dragging = useFileDrop((paths) => {
    const plan = planDrop(paths, selection?.kind ?? null);
    if (plan.kind) addFiles(plan.kind, plan.paths);
  });

  /** Commands from the macOS menu bar, the in-app menu and the Ctrl shortcuts. */
  const runCommand = (command: AppCommand) => {
    switch (command) {
      case "go_home":
        return navigate("home");
      case "go_recents":
        return navigate("recents");
      case "open_settings":
        return navigate("settings");
      case "open_about":
        return openPage("settings", "about");
      case "compress_image":
        return pickFiles("image");
      case "compress_pdf":
        return pickFiles("pdf");
      case "open_source":
        return openExternal(SOURCE_URL);
      case "open_license":
        return openExternal(LICENSE_URL);
    }
  };

  useMenuEvents(runCommand);
  useMenuLanguage();
  // On macOS the menu bar handles these as Cmd shortcuts.
  useShortcuts(runCommand, !isMacApp);

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
    return <HomePage onOpenTool={openTool} />;
  };

  return (
    <AppShell page={page} onNavigate={navigate} onCommand={runCommand}>
      {page === "home" && homeView()}
      {page === "recents" && <RecentsPage />}
      {page === "settings" && <SettingsPage tab={settingsTab} onTabChange={setSettingsTab} />}
      {dragging && (
        <DropOverlay plan={planDrop(dragging, selection?.kind ?? null)} isBusy={job.isRunning} />
      )}
    </AppShell>
  );
}

export default App;
