import type { ComponentType } from "react";
import { History, House, Settings, type IconProps } from "@keyline-icons/react";
import {
  History as HistoryFill,
  House as HouseFill,
  Settings as SettingsFill,
} from "@keyline-icons/react/fill";

export type Page = "home" | "recents" | "settings";

type Icon = ComponentType<IconProps>;

export interface NavItem {
  id: Page;
  label: string;
  icon: Icon;
  /** Shown while the item is the current page. */
  currentIcon: Icon;
}

export const MAIN_NAV: NavItem[] = [
  { id: "home", label: "Beranda", icon: House, currentIcon: HouseFill },
  { id: "recents", label: "Riwayat", icon: History, currentIcon: HistoryFill },
];

export const SETTINGS_NAV: NavItem = {
  id: "settings",
  label: "Pengaturan",
  icon: Settings,
  currentIcon: SettingsFill,
};
