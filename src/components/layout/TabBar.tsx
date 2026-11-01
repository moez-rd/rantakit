import { Link } from "react-aria-components";
import { tv } from "tailwind-variants";
import { focusRing } from "@/lib/react-aria-utils";
import { MAIN_NAV, SETTINGS_NAV, type Page } from "./navigation";

const tabLink = tv({
  extend: focusRing,
  base: [
    "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-xs text-text-muted",
    "cursor-default select-none [-webkit-tap-highlight-color:transparent]",
    "pressed:bg-badge-bg",
    "data-[current]:font-medium data-[current]:text-brand-strong",
  ],
});

interface TabBarProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

/** Bottom navigation for narrow (mobile) screens; replaces the sidebar. */
export function TabBar({ page, onNavigate }: TabBarProps) {
  return (
    <nav aria-label="Navigasi utama" className="flex shrink-0 border-t border-border bg-bg px-2 md:hidden">
      {[...MAIN_NAV, SETTINGS_NAV].map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          aria-current={page === id ? "page" : undefined}
          onPress={() => onNavigate(id)}
          className={(renderProps) => tabLink(renderProps)}
        >
          <Icon aria-hidden className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
