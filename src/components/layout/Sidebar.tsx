import { Link } from "react-aria-components";
import { tv } from "tailwind-variants";
import { focusRing } from "@/lib/react-aria-utils";
import { MAIN_NAV, SETTINGS_NAV, type NavItem, type Page } from "./navigation";

const navLink = tv({
  extend: focusRing,
  base: [
    "flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-muted cursor-default select-none transition",
    "pointer-coarse:h-11",
    "hovered:bg-black/5 hovered:text-foreground dark:hovered:bg-white/5",
    "data-[current]:bg-surface data-[current]:font-medium data-[current]:text-foreground",
    "data-[current]:shadow-xs data-[current]:ring-1 data-[current]:ring-border",
  ],
});

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ page, onNavigate }: SidebarProps) {
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
    <nav aria-label="Navigasi utama" className="hidden w-52 shrink-0 flex-col gap-1 p-3 md:flex">
      <div className="mb-4 flex items-center gap-2 px-2 pt-1">
        <img src="/dikompres.svg" alt="" className="size-7" />
        <span className="font-semibold">Dikompres</span>
      </div>
      {MAIN_NAV.map(item)}
      <div className="mt-auto">{item(SETTINGS_NAV)}</div>
    </nav>
  );
}
