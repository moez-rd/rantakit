import type { ReactNode } from "react";
import { isDesktopApp, isMacApp } from "@/lib/platform";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import type { NavTarget, Page } from "./navigation";
import { TitleBar } from "./TitleBar";

interface AppShellProps {
  page: Page;
  onNavigate: (target: NavTarget) => void;
  /** The sidebar's "Buka" button: choose files, then a Tool. */
  onOpen: () => void;
  children: ReactNode;
}

/**
 * Desktop: sidebar on its own background, content beside it.
 * Mobile: full-width content with a bottom tab bar.
 */
export function AppShell({ page, onNavigate, onOpen, children }: AppShellProps) {
  return (
    <div className="flex h-full flex-col md:bg-canvas">
      {/* macOS draws the content under an overlay title bar: keep the traffic
          lights clear and let this strip move the window. */}
      {isMacApp && <div data-tauri-drag-region className="h-7 shrink-0" />}
      {isDesktopApp && !isMacApp && <TitleBar />}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row md:gap-1.5 md:p-1.5 md:pt-0">
        <Sidebar page={page} onNavigate={onNavigate} onOpen={onOpen} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto md:rounded-xl md:border md:border-border md:bg-surface">
          {children}
        </main>
        <TabBar page={page} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
