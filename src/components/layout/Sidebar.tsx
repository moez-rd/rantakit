import { Plus } from "@keyline-icons/react";
import { Button, Link } from "react-aria-components";
import { useT } from "@/i18n";
import { focusRing, tv } from "@/lib/react-aria-utils";
import { MAIN_NAV, SETTINGS_NAV, type NavItem, type NavTarget, type Page } from "./navigation";

/** Sidebar item, 44 px: hover changes only the background. */
const navLink = tv({
  extend: focusRing,
  base: [
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-label font-medium text-text-muted",
    "cursor-default select-none transition-colors",
    "hover:bg-badge-bg hover:text-text",
    "data-[current]:bg-brand-soft data-[current]:font-semibold data-[current]:text-brand-strong",
  ],
});

/** "Buka", the sidebar's one action: the primary color sets it apart from the pages. */
const openButton = tv({
  extend: focusRing,
  base: [
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-label font-semibold",
    "bg-primary text-on-primary cursor-default select-none transition-colors",
    "hover:bg-primary-hover",
  ],
});

interface SidebarProps {
  page: Page;
  onNavigate: (target: NavTarget) => void;
  onOpen: () => void;
}

export function Sidebar({ page, onNavigate, onOpen }: SidebarProps) {
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
      className="hidden w-70 shrink-0 flex-col gap-1 rounded-xl border border-border bg-sidebar px-4 pt-5 pb-4 md:flex"
    >
      <Button onPress={onOpen} className={(renderProps) => openButton(renderProps)}>
        <Plus aria-hidden className="size-6" />
        {t("nav.open")}
      </Button>
      <div className="h-2" />
      {MAIN_NAV.map(item)}
      <div className="mt-auto">{item(SETTINGS_NAV)}</div>
    </nav>
  );
}
