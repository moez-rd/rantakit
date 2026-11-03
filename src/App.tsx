import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { Modal } from "@/components/ui/Modal";
import type { NavTarget, Page } from "@/components/layout/navigation";
import type { ToolOptions } from "@/features/compress/taskApi";
import { useCompressJob } from "@/features/compress/useCompressJob";
import { DropDialog } from "@/features/drop/DropDialog";
import { dropHint } from "@/features/drop/dropHint";
import { matchFiles, useDropMatch, type DropMatch } from "@/features/drop/dropMatch";
import { DropOverlay } from "@/features/drop/DropOverlay";
import { pickAnyFiles } from "@/features/drop/pickFiles";
import { HomePage } from "@/features/home/HomePage";
import type { ToolId } from "@/features/home/tools";
import { HistoryPage } from "@/features/history/HistoryPage";
import { SettingsDialog, type SettingsTab } from "@/features/settings/SettingsDialog";
import { LeaveDialog } from "@/features/tool/LeaveDialog";
import { ToolPage } from "@/features/tool/ToolPage";
import { UpdateNotice } from "@/features/update/UpdateNotice";
import { isShipped, toolDef, type ShippedTool } from "@/features/tool/tools";
import { useShortcuts, type AppCommand } from "@/lib/appCommands";
import { useFileDrop } from "@/lib/fileDrop";
import { useMenuEvents, useMenuLanguage } from "@/lib/menuEvents";
import { useNavHistory } from "@/lib/navHistory";
import { isAndroidApp, isMacApp } from "@/lib/platform";
import { useStoredState } from "@/lib/storedState";
import { useT } from "@/i18n";

/** Dropped files waiting for the user to choose a Tool. */
interface Dropped {
  paths: string[];
  match: Extract<DropMatch, { status: "fits" }>;
}

const unique = (paths: string[]) => [...new Set(paths)];

/** Whether the sidebar is shown, remembered between launches; shown unless the user hid it. */
const parseLayout = (stored: unknown) => ({
  sidebar: !(stored && typeof stored === "object" && (stored as { sidebar?: unknown }).sidebar === false),
});

function App() {
  const tr = useT();
  const { t } = tr;
  const [page, setPage] = useState<Page>("home");
  /** The Settings dialog's tab while it is open over the page. */
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  /** The Tool page on screen, over Home. */
  const [tool, setTool] = useState<ShippedTool | null>(null);
  /** The Originals added to that page. */
  const [paths, setPaths] = useState<string[]>([]);
  const job = useCompressJob();
  /** What to do once the user agrees to leave the Tool page, and whether that stops a Task. */
  const [leaving, setLeaving] = useState<{ action: () => void; working: boolean } | null>(null);

  /** Clears the Tool page; a running Task is stopped, and its finished Results stay. */
  const closeTool = () => {
    setTool(null);
    setPaths([]);
    job.reset();
  };

  /** Run `action`, which leaves the Tool page, after asking if files would be lost. */
  const leaveTool = (action: () => void) => {
    const hasFiles = paths.length > 0 && job.items.length === 0;
    if (tool && (hasFiles || job.isRunning)) setLeaving({ action, working: job.isRunning });
    else action();
  };

  const navigate = (next: NavTarget, tab: SettingsTab = "appearance") => {
    // Settings opens over the page; the Tool page stays as it is.
    if (next === "settings") return setSettingsTab(tab);
    leaveTool(() => {
      closeTool();
      setPage(next satisfies Page);
    });
  };

  const openTool = (id: ShippedTool, withPaths: string[] = []) => {
    setPage("home");
    setTool(id);
    setPaths(unique(withPaths));
    job.reset();
  };

  /** Add Originals to the open Tool page, from the picker or a drop. */
  const addFiles = (added: string[]) => {
    if (job.isRunning || added.length === 0) return;
    // After a Result, new files start over.
    if (job.items.length > 0) {
      job.reset();
      setPaths(unique(added));
    } else {
      setPaths((prev) => unique([...prev, ...added]));
    }
  };

  const pickFiles = async (id: ShippedTool) => addFiles(await toolDef(id).pick());

  /** From the menu: open the Tool's page, then the picker. */
  const startTool = (id: ShippedTool) => {
    if (tool === id && page === "home") return pickFiles(id);
    leaveTool(() => {
      openTool(id);
      pickFiles(id);
    });
  };

  const startJob = (options: ToolOptions) => job.start(paths, options);

  const [dropped, setDropped] = useState<Dropped | null>(null);
  const pageTool = page === "home" ? tool : null;

  // A Tool page sits over Home, so the Tool alone names where the user is.
  const history = useNavHistory<Page | ShippedTool>(pageTool ?? page);

  /** Back or Forward; leaving a Tool page asks first, and staying keeps the history where it is. */
  const goHistory = (delta: -1 | 1) => {
    const target = history.target(delta);
    if (!target) return;
    leaveTool(() => {
      history.go(delta);
      if (target === "home" || target === "history") {
        closeTool();
        setPage(target);
      } else {
        openTool(target);
      }
    });
  };

  const [layout, updateLayout] = useStoredState("rantakit.layout", parseLayout);
  const toggleSidebar = () => updateLayout({ sidebar: !layout.sidebar });

  /**
   * Files dropped on the window or chosen with "Buka": ask for a Tool, or add
   * them to the open one. Files that don't fit come back with the reason, in
   * the drop overlay's words.
   */
  const receiveFiles = async (received: string[]) => {
    if (job.isRunning || received.length === 0) return null;
    const match = await matchFiles(received);
    const hint = dropHint(tr, { busy: false, openTool: pageTool, match, count: received.length });
    if (!hint.canDrop || match.status !== "fits") return hint;
    if (!pageTool) setDropped({ paths: received, match });
    else addFiles(received);
    return null;
  };

  /** A drop that doesn't fit was already explained by the overlay while dragging. */
  const dragging = useFileDrop((dropPaths) => void receiveFiles(dropPaths));

  /** Why the files chosen with "Buka" were not taken. */
  const [refused, setRefused] = useState<{ title: string; detail?: string } | null>(null);
  const openFiles = async () => setRefused(await receiveFiles(await pickAnyFiles()));
  const draggedMatch = useDropMatch(dragging);

  const chooseDropTool = (id: ToolId) => {
    if (isShipped(id) && dropped) openTool(id, dropped.paths);
    setDropped(null);
  };

  // Escape on a Tool page is Back, asking first when files would be lost.
  useEffect(() => {
    if (!pageTool || leaving || dropped || settingsTab) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) goHistory(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // The mouse's side buttons are Back and Forward. Cancelling them also keeps
  // the webview from trying a navigation of its own.
  useEffect(() => {
    if (leaving || dropped || settingsTab) return;
    const isSideButton = (e: MouseEvent) => e.button === 3 || e.button === 4;
    const onMouseDown = (e: MouseEvent) => {
      if (isSideButton(e)) e.preventDefault();
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isSideButton(e)) return;
      e.preventDefault();
      goHistory(e.button === 3 ? -1 : 1);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  /** Commands from the macOS menu bar and the keyboard shortcuts. */
  const runCommand = (command: AppCommand) => {
    switch (command) {
      case "go_home":
        return navigate("home");
      case "go_history":
        return navigate("history");
      case "open_settings":
        return navigate("settings");
      case "compress_image":
        return startTool("kompres-foto");
      case "compress_pdf":
        return startTool("kompres-pdf");
      case "go_back":
        return goHistory(-1);
      case "go_forward":
        return goHistory(1);
      case "toggle_sidebar":
        return toggleSidebar();
    }
  };

  useMenuEvents(runCommand);
  useMenuLanguage();
  // On macOS the menu bar handles these as Cmd shortcuts; Android has none.
  useShortcuts(runCommand, !isMacApp && !isAndroidApp);

  const noun = tool ? toolDef(tool).noun : "photo";

  return (
    <AppShell
      page={page}
      onNavigate={(next) => navigate(next)}
      onOpen={openFiles}
      titleBar={{
        canBack: history.canBack,
        canForward: history.canForward,
        onBack: () => goHistory(-1),
        onForward: () => goHistory(1),
        sidebarOpen: layout.sidebar,
        onToggleSidebar: toggleSidebar,
      }}
      titleBarEnd={<UpdateNotice busy={job.isRunning} />}
    >
      {page === "home" &&
        (tool ? (
          <ToolPage
            key={tool}
            tool={tool}
            paths={paths}
            job={job}
            onPick={() => pickFiles(tool)}
            onRemove={(path) => setPaths((prev) => prev.filter((p) => p !== path))}
            onBack={() => leaveTool(closeTool)}
            onStart={startJob}
            onProcessAnother={() => {
              job.reset();
              setPaths([]);
            }}
          />
        ) : (
          <HomePage onOpenTool={(id) => isShipped(id) && openTool(id)} />
        ))}
      {page === "history" && <HistoryPage />}
      {settingsTab && (
        <SettingsDialog tab={settingsTab} onTabChange={setSettingsTab} onClose={() => setSettingsTab(null)} />
      )}
      {dragging && (
        <DropOverlay
          {...dropHint(tr, { busy: job.isRunning, openTool: pageTool, match: draggedMatch, count: dragging.length })}
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
      {refused && (
        <Modal isOpen isDismissable onOpenChange={(open) => !open && setRefused(null)}>
          <AlertDialog
            title={refused.title}
            actionLabel={t("drop.pickAgain")}
            cancelLabel={t("common.close")}
            onAction={openFiles}
          >
            {refused.detail}
          </AlertDialog>
        </Modal>
      )}
      {leaving && (
        <LeaveDialog
          {...(leaving.working
            ? {
                title: t("leave.working.title"),
                body: t(`leave.working.body.${noun}`),
                leaveLabel: t("leave.working.stop"),
                stayLabel: t("leave.working.keep"),
              }
            : {
                title: t("leave.title"),
                body: t(`leave.body.${noun}`),
                leaveLabel: t("leave.leave"),
                stayLabel: t("leave.stay"),
              })}
          onStay={() => setLeaving(null)}
          onLeave={() => {
            setLeaving(null);
            leaving.action();
          }}
        />
      )}
    </AppShell>
  );
}

export default App;
