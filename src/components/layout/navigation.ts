import { Clock, House, Settings, type LucideIcon } from "lucide-react";

export type Page = "home" | "recents" | "settings";

export interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { id: "home", label: "Beranda", icon: House },
  { id: "recents", label: "Terbaru", icon: Clock },
];

export const SETTINGS_NAV: NavItem = { id: "settings", label: "Pengaturan", icon: Settings };
