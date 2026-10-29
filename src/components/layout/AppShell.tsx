import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import type { Page } from "./navigation";

interface AppShellProps {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

/**
 * Desktop: sidebar on the window background, content in a rounded inset panel.
 * Mobile: full-width content with a bottom tab bar.
 */
export function AppShell({ page, onNavigate, children }: AppShellProps) {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <Sidebar page={page} onNavigate={onNavigate} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto md:m-2 md:ml-0 md:rounded-2xl md:border md:border-border md:bg-surface">
        {children}
      </main>
      <TabBar page={page} onNavigate={onNavigate} />
    </div>
  );
}
