import type { ReactNode } from "react";
import type { AppCommand } from "@/lib/appCommands";
import { isMacApp } from "@/lib/platform";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import type { NavTarget, Page } from "./navigation";

interface AppShellProps {
  page: Page;
  onNavigate: (target: NavTarget) => void;
  onCommand: (command: AppCommand) => void;
  children: ReactNode;
}

/**
 * Desktop: sidebar on its own background, content beside it.
 * Mobile: full-width content with a bottom tab bar.
 */
export function AppShell({ page, onNavigate, onCommand, children }: AppShellProps) {
  return (
    <div className="flex h-full flex-col">
      {/* macOS draws the content under an overlay title bar: keep the traffic
          lights clear and let this strip move the window. */}
      {isMacApp && <div data-tauri-drag-region className="h-7 shrink-0" />}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar page={page} onNavigate={onNavigate} onCommand={onCommand} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
          {children}
        </main>
        <TabBar page={page} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
