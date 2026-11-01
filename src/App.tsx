import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/navigation";
import type { ToolOptions } from "@/features/compress/taskApi";
import { useCompressJob } from "@/features/compress/useCompressJob";
import { DropDialog } from "@/features/drop/DropDialog";
import { dropHint } from "@/features/drop/dropHint";
import { matchFiles, useDropMatch, type DropMatch } from "@/features/drop/dropMatch";
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
import { LeaveDialog } from "@/features/tool/LeaveDialog";
import { ToolPage } from "@/features/tool/ToolPage";
import { isShipped, toolDef, type ShippedTool } from "@/features/tool/tools";
import { useShortcuts, type AppCommand } from "@/lib/appCommands";
import { useFileDrop } from "@/lib/fileDrop";
import { LICENSE_URL, openExternal, SOURCE_URL } from "@/lib/links";
import { useMenuEvents, useMenuLanguage } from "@/lib/menuEvents";
import { isMacApp } from "@/lib/platform";
import { useT } from "@/i18n";

/** Dropped files waiting for the user to choose a Tool. */
interface Dropped {
  paths: string[];
  match: Extract<DropMatch, { status: "fits" }>;
}

const unique = (paths: string[]) => [...new Set(paths)];

function App() {
  const tr = useT();
  const { t } = tr;
  const [page, setPage] = useState<Page>("home");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  /** The Tool page on screen, over Home. */
  const [tool, setTool] = useState<ShippedTool | null>(null);
  /** The Originals added to that page. */
  const [paths, setPaths] = useState<string[]>([]);
  const job = useCompressJob();
  /** What to do once the user agrees to leave the Tool page. */
  const [leaving, setLeaving] = useState<(() => void) | null>(null);

  const openPage = (next: Page, tab: SettingsTab) => {
    if (next === "settings" && hasSettingsWindow) {
      openSettingsWindow(tab);
    } else {
      if (next === "settings") setSettingsTab(tab);
      setPage(next);
    }
  };

  /** Clears the Tool page; a running Task is stopped, and its finished Results stay. */
  const closeTool = () => {
    setTool(null);
    setPaths([]);
    job.reset();
  };

  /** Run `action`, which leaves the Tool page, after asking if files would be lost. */
  const leaveTool = (action: () => void) => {
    const hasFiles = paths.length > 0 && job.items.length === 0;
    if (tool && (hasFiles || job.isRunning)) setLeaving(() => action);
    else action();
  };

  const navigate = (next: Page, tab: SettingsTab = "general") => {
    // The settings window opens on top; the Tool page stays as it is.
    if (next === "settings" && hasSettingsWindow) return openSettingsWindow(tab);
    leaveTool(() => {
      closeTool();
      openPage(next, tab);
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

  const dragging = useFileDrop(async (dropPaths) => {
    if (job.isRunning) return;
    const match = await matchFiles(dropPaths);
    if (match.status !== "fits") return;
    if (!pageTool) setDropped({ paths: dropPaths, match });
    else if (match.tools.includes(pageTool)) addFiles(dropPaths);
  });
  const draggedMatch = useDropMatch(dragging);

  const chooseDropTool = (id: ToolId) => {
    if (isShipped(id) && dropped) openTool(id, dropped.paths);
    setDropped(null);
  };

  // Escape leaves the Tool page, asking first when files would be lost.
  useEffect(() => {
    if (!pageTool || leaving || dropped) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) leaveTool(closeTool);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
        return navigate("settings", "about");
      case "compress_image":
        return startTool("kompres-foto");
      case "compress_pdf":
        return startTool("kompres-pdf");
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

  const noun = tool ? toolDef(tool).noun : "photo";

  return (
    <AppShell page={page} onNavigate={(next) => navigate(next)} onCommand={runCommand}>
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
      {page === "recents" && <RecentsPage />}
      {page === "settings" && <SettingsPage tab={settingsTab} onTabChange={setSettingsTab} />}
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
      {leaving && (
        <LeaveDialog
          title={t("leave.title")}
          body={t(`leave.body.${noun}`)}
          leaveLabel={t("leave.leave")}
          stayLabel={t("leave.stay")}
          onStay={() => setLeaving(null)}
          onLeave={() => {
            setLeaving(null);
            leaving();
          }}
        />
      )}
    </AppShell>
  );
}

export default App;
