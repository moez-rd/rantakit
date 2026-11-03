import type { ComponentType } from "react";
import { History, House, Settings, type IconProps } from "@keyline-icons/react";
import {
  History as HistoryFill,
  House as HouseFill,
  Settings as SettingsFill,
} from "@keyline-icons/react/fill";

export type Page = "home" | "history";
/** Where a navigation item leads: a page, or Settings (a dialog over the page, or a page on a phone). */
export type NavTarget = Page | "settings";

type Icon = ComponentType<IconProps>;

export interface NavItem {
  id: NavTarget;
  label: "nav.home" | "nav.history" | "nav.settings";
  icon: Icon;
  /** Shown while the item is the current page. */
  currentIcon: Icon;
}

export const MAIN_NAV: NavItem[] = [
  { id: "home", label: "nav.home", icon: House, currentIcon: HouseFill },
  { id: "history", label: "nav.history", icon: History, currentIcon: HistoryFill },
];

export const SETTINGS_NAV: NavItem = {
  id: "settings",
  label: "nav.settings",
  icon: Settings,
  currentIcon: SettingsFill,
};
