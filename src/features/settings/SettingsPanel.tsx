import { useEffect, useState, type ReactNode } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Monitor, Moon, Sun } from "lucide-react";
import { Link } from "@/components/ui/Link";
import { Select, SelectItem } from "@/components/ui/Select";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { LICENSE_URL, openExternal } from "@/lib/links";
import { usePreferences, ZOOM_LEVELS, type Language, type Theme } from "./preferences";
import type { SettingsTab } from "./settingsWindow";

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}

function GeneralTab() {
  const [prefs, update] = usePreferences();

  return (
    <div className="flex flex-col divide-y divide-border">
      <Row label="Tema">
        <ToggleButtonGroup
          aria-label="Tema"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[prefs.theme]}
          onSelectionChange={(keys) => update({ theme: [...keys][0] as Theme })}
        >
          <ToggleButton id="light">
            <Sun aria-hidden className="size-4" /> Terang
          </ToggleButton>
          <ToggleButton id="dark">
            <Moon aria-hidden className="size-4" /> Gelap
          </ToggleButton>
          <ToggleButton id="system">
            <Monitor aria-hidden className="size-4" /> Sistem
          </ToggleButton>
        </ToggleButtonGroup>
      </Row>

      <Row label="Ukuran tampilan" description="Perbesar atau perkecil seluruh antarmuka.">
        <Select
          aria-label="Ukuran tampilan"
          className="sm:w-36"
          value={String(prefs.zoom)}
          onChange={(key) => update({ zoom: Number(key) })}
        >
          {ZOOM_LEVELS.map((z) => (
            <SelectItem key={z} id={String(z)}>
              {`${Math.round(z * 100)}%`}
            </SelectItem>
          ))}
        </Select>
      </Row>

      <Row label="Bahasa" description="Terjemahan bahasa Inggris segera hadir.">
        <Select
          aria-label="Bahasa"
          className="sm:w-44"
          value={prefs.language}
          onChange={(key) => update({ language: key as Language })}
        >
          <SelectItem id="id">Bahasa Indonesia</SelectItem>
          <SelectItem id="en">English</SelectItem>
        </Select>
      </Row>
    </div>
  );
}

function AboutTab() {
  const [version, setVersion] = useState<string>();

  useEffect(() => {
    if (isTauri()) getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <img src="/rantakit.svg" alt="" className="size-16" />
      <div className="flex flex-col">
        <span className="text-lg font-semibold">Rantakit</span>
        <span className="text-sm text-muted">{version ? `Versi ${version}` : "Versi pengembangan"}</span>
      </div>
      <p className="max-w-xs text-sm">Kompres berkas, tetap di perangkatmu.</p>
      <p className="max-w-xs text-xs text-muted">
        Perangkat lunak bebas di bawah lisensi AGPL-3.0-or-later.{" "}
        <Link onPress={() => openExternal(LICENSE_URL)}>Lihat lisensi</Link>
      </p>
    </div>
  );
}

interface SettingsPanelProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsPanel({ tab, onTabChange }: SettingsPanelProps) {
  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => onTabChange(key as SettingsTab)}>
      <TabList aria-label="Pengaturan">
        <Tab id="general">Umum</Tab>
        <Tab id="about">Tentang</Tab>
      </TabList>
      <TabPanel id="general">
        <GeneralTab />
      </TabPanel>
      <TabPanel id="about">
        <AboutTab />
      </TabPanel>
    </Tabs>
  );
}
