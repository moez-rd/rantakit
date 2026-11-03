import type { ReactNode } from "react";
import { isDesktopApp } from "@/lib/platform";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import type { NavTarget, Page } from "./navigation";
import { TitleBar, type TitleBarNav } from "./TitleBar";

interface AppShellProps {
  page: Page;
  onNavigate: (target: NavTarget) => void;
  /** The sidebar's "Buka" button: choose files, then a Tool. */
  onOpen: () => void;
  /** Back, Forward and the sidebar toggle, shown in the desktop title bar. */
  titleBar: TitleBarNav;
  /** Shown at the title bar's right end, before the window controls. */
  titleBarEnd?: ReactNode;
  children: ReactNode;
}

/**
 * Desktop: a title bar, then the sidebar and the content as two cards on the
 * window background; the sidebar can be hidden. Mobile: full-width content
 * with a bottom tab bar.
 */
export function AppShell({ page, onNavigate, onOpen, titleBar, titleBarEnd, children }: AppShellProps) {
  return (
    <div className="flex h-full flex-col md:bg-canvas">
      {isDesktopApp && <TitleBar {...titleBar}>{titleBarEnd}</TitleBar>}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row md:gap-1.5 md:p-1.5 md:pt-0">
        {titleBar.sidebarOpen && <Sidebar page={page} onNavigate={onNavigate} onOpen={onOpen} />}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto md:rounded-xl md:border md:border-border md:bg-surface">
          {children}
        </main>
        <TabBar page={page} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
