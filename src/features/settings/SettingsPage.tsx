import { SettingsPanel } from "./SettingsPanel";
import type { SettingsTab } from "./settingsWindow";

interface SettingsPageProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/** In-app settings page, used on mobile and in the browser. Desktop opens a separate window. */
export function SettingsPage({ tab, onTabChange }: SettingsPageProps) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Pengaturan</h1>
      <SettingsPanel tab={tab} onTabChange={onTabChange} />
    </div>
  );
}
