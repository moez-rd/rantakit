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
import { usePreferences, type Language, type TextSize, type Theme } from "./preferences";
import type { SettingsTab } from "./settingsWindow";

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col">
        <span className="text-small font-medium">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
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
          <ToggleButton id="system">
            <Monitor aria-hidden className="size-4" /> Ikuti sistem
          </ToggleButton>
          <ToggleButton id="light">
            <Sun aria-hidden className="size-4" /> Terang
          </ToggleButton>
          <ToggleButton id="dark">
            <Moon aria-hidden className="size-4" /> Gelap
          </ToggleButton>
        </ToggleButtonGroup>
      </Row>

      <Row label="Ukuran teks">
        <ToggleButtonGroup
          aria-label="Ukuran teks"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[prefs.textSize]}
          onSelectionChange={(keys) => update({ textSize: [...keys][0] as TextSize })}
        >
          <ToggleButton id="normal">Normal</ToggleButton>
          <ToggleButton id="large">Besar</ToggleButton>
          <ToggleButton id="larger">Lebih besar</ToggleButton>
        </ToggleButtonGroup>
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
        <span className="text-section">Rantakit</span>
        <span className="text-small text-text-muted">{version ? `Versi ${version}` : "Versi pengembangan"}</span>
      </div>
      <p className="max-w-xs text-small">Kompres berkas, tetap di perangkatmu.</p>
      <p className="max-w-xs text-small text-text-muted">
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
