import { SettingsPanel } from "./SettingsPanel";

/** In-app settings page, used on mobile and in the browser. Desktop opens a separate window. */
export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Pengaturan</h1>
      <SettingsPanel />
    </div>
  );
}
