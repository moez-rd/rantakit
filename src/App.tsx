import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/navigation";
import { FILE_KINDS, type FileKind } from "@/features/compress/fileKinds";
import { ImageOptions } from "@/features/compress/ImageOptions";
import { toImageOptions, useImageSettings } from "@/features/compress/imageSettings";
import { JobView } from "@/features/compress/JobView";
import { PdfOptions } from "@/features/compress/PdfOptions";
import { toPdfOptions, usePdfSettings } from "@/features/compress/pdfSettings";
import { SetupView } from "@/features/compress/SetupView";
import { useCompressJob } from "@/features/compress/useCompressJob";
import { DropDialog } from "@/features/drop/DropDialog";
import { dropHint } from "@/features/drop/dropHint";
import { matchFiles, TOOL_KINDS, KIND_TOOLS, useDropMatch, type DropMatch } from "@/features/drop/dropMatch";
import { DropOverlay } from "@/features/drop/DropOverlay";
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
import { useT } from "@/i18n";

/** Picked files waiting for the user to choose settings. */
interface Selection {
  kind: FileKind;
  paths: string[];
}

/** Dropped files waiting for the user to choose a Tool. */
interface Dropped {
  paths: string[];
  match: Extract<DropMatch, { status: "fits" }>;
}

function App() {
  const tr = useT();
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
    const kind = TOOL_KINDS[id];
    if (kind) pickFiles(kind);
  };

  const startJob = () => {
    if (!selection) return;
    const { kind, paths } = selection;
    job.start(kind, paths, kind === "image" ? toImageOptions(imageSettings) : toPdfOptions(pdfSettings));
    setSelection(null);
  };

  const [dropped, setDropped] = useState<Dropped | null>(null);
  /** The Tool page on screen takes dropped files directly; Home and History ask which Tool. */
  const openKind = page !== "home" ? null : (selection?.kind ?? (job.items.length > 0 ? job.kind : null));

  const dragging = useFileDrop(async (paths) => {
    if (job.isRunning) return;
    const match = await matchFiles(paths);
    if (match.status !== "fits") return;
    if (!openKind) setDropped({ paths, match });
    else if (match.tools.includes(KIND_TOOLS[openKind])) addFiles(openKind, paths);
  });
  const draggedMatch = useDropMatch(dragging);

  const chooseDropTool = (id: ToolId) => {
    const kind = TOOL_KINDS[id];
    if (kind && dropped) addFiles(kind, dropped.paths);
    setDropped(null);
  };

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
        <DropOverlay
          {...dropHint(tr, { busy: job.isRunning, openKind, match: draggedMatch, count: dragging.length })}
        />
      )}
      {dropped && (
        <DropDialog
          paths={dropped.paths}
          match={dropped.match}
          onChoose={chooseDropTool}
          onClose={() => setDropped(null)}
        />
      )}
    </AppShell>
  );
}

export default App;
