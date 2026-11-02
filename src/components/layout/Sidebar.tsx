import { Link } from "react-aria-components";
import type { AppCommand } from "@/lib/appCommands";
import { isMacApp } from "@/lib/platform";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";
import { AppMenu } from "./AppMenu";
import { MAIN_NAV, SETTINGS_NAV, type NavItem, type NavTarget, type Page } from "./navigation";

/** Sidebar item, 44 px: hover changes only the background. */
const navLink = tv({
  extend: focusRing,
  base: [
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-label font-medium text-text-muted",
    "cursor-default select-none transition-colors",
    "hovered:bg-badge-bg hovered:text-text",
    "data-[current]:bg-brand-soft data-[current]:font-semibold data-[current]:text-brand-strong",
  ],
});

interface SidebarProps {
  page: Page;
  onNavigate: (target: NavTarget) => void;
  onCommand: (command: AppCommand) => void;
}

export function Sidebar({ page, onNavigate, onCommand }: SidebarProps) {
  const { t } = useT();
  const item = ({ id, label, icon, currentIcon }: NavItem) => {
    const Icon = page === id ? currentIcon : icon;
    return (
      <Link
        key={id}
        aria-current={page === id ? "page" : undefined}
        onPress={() => onNavigate(id)}
        className={(renderProps) => navLink(renderProps)}
      >
        <Icon aria-hidden className="size-6" />
        {t(label)}
      </Link>
    );
  };

  return (
    <nav
      aria-label={t("nav.label")}
      className="hidden w-60 shrink-0 flex-col gap-1 border-e border-border bg-sidebar px-4 pt-5 pb-4 md:flex"
    >
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <img src="/rantakit.svg" alt="" className="size-8" />
        <span className="flex-1 font-display text-wordmark">Rantakit</span>
        {/* macOS has these in the menu bar. */}
        {!isMacApp && <AppMenu onCommand={onCommand} />}
      </div>
      {MAIN_NAV.map(item)}
      <div className="mt-auto">{item(SETTINGS_NAV)}</div>
    </nav>
  );
}
