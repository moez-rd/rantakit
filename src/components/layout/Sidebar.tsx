import { Link } from "react-aria-components";
import type { AppCommand } from "@/lib/appCommands";
import { isMacApp } from "@/lib/platform";
import { focusRing, tv } from "@/lib/react-aria-utils";
import { AppMenu } from "./AppMenu";
import { MAIN_NAV, SETTINGS_NAV, type NavItem, type Page } from "./navigation";

const navLink = tv({
  extend: focusRing,
  base: [
    "flex h-9 items-center gap-3 rounded-lg px-3 text-small text-text-muted cursor-default select-none transition",
    "pointer-coarse:h-11",
    "hovered:bg-badge-bg hovered:text-text",
    "data-[current]:bg-brand-soft data-[current]:font-semibold data-[current]:text-brand-strong",
  ],
});

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  onCommand: (command: AppCommand) => void;
}

export function Sidebar({ page, onNavigate, onCommand }: SidebarProps) {
  const item = ({ id, label, icon: Icon }: NavItem) => (
    <Link
      key={id}
      aria-current={page === id ? "page" : undefined}
      onPress={() => onNavigate(id)}
      className={(renderProps) => navLink(renderProps)}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </Link>
  );

  return (
    <nav aria-label="Navigasi utama" className="hidden w-52 shrink-0 flex-col gap-1 border-e border-border bg-sidebar p-3 md:flex">
      <div className="mb-4 flex items-center gap-2 ps-2 pt-1">
        <img src="/rantakit.svg" alt="" className="size-7" />
        <span className="flex-1 font-display text-wordmark">Rantakit</span>
        {/* macOS has these in the menu bar. */}
        {!isMacApp && <AppMenu onCommand={onCommand} />}
      </div>
      {MAIN_NAV.map(item)}
      <div className="mt-auto">{item(SETTINGS_NAV)}</div>
    </nav>
  );
}
