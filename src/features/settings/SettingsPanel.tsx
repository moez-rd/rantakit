import { useEffect, useState, type ReactNode } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { Monitor, Moon, Sun } from "@keyline-icons/react";
import { Link } from "@/components/ui/Link";
import { Radio, RadioGroup } from "@/components/ui/RadioGroup";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { ToggleButtonGroup } from "@/components/ui/ToggleButtonGroup";
import { useT } from "@/i18n";
import { LICENSE_URL, openExternal } from "@/lib/links";
import { systemLanguage, usePreferences, type Language, type LanguageChoice, type TextSize, type Theme } from "./preferences";

/** Each language is named in itself, whatever the UI language. */
const LANGUAGE_NAMES: Record<Language, string> = { id: "Bahasa Indonesia", en: "English" };
import type { SettingsTab } from "./settingsWindow";

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col">
        <span className="text-label">{label}</span>
        {description && <span className="text-small text-text-muted">{description}</span>}
      </div>
      {children}
    </div>
  );
}

function GeneralTab() {
  const { t } = useT();
  const [prefs, update] = usePreferences();

  return (
    <div className="flex flex-col divide-y divide-border">
      <Row label={t("settings.theme")}>
        <ToggleButtonGroup
          aria-label={t("settings.theme")}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[prefs.theme]}
          onSelectionChange={(keys) => update({ theme: [...keys][0] as Theme })}
        >
          <ToggleButton id="system">
            <Monitor aria-hidden className="size-5" /> {t("settings.theme.system")}
          </ToggleButton>
          <ToggleButton id="light">
            <Sun aria-hidden className="size-5" /> {t("settings.theme.light")}
          </ToggleButton>
          <ToggleButton id="dark">
            <Moon aria-hidden className="size-5" /> {t("settings.theme.dark")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Row>

      <Row label={t("settings.textSize")}>
        <ToggleButtonGroup
          aria-label={t("settings.textSize")}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[prefs.textSize]}
          onSelectionChange={(keys) => update({ textSize: [...keys][0] as TextSize })}
        >
          <ToggleButton id="normal">{t("settings.textSize.normal")}</ToggleButton>
          <ToggleButton id="large">{t("settings.textSize.large")}</ToggleButton>
          <ToggleButton id="larger">{t("settings.textSize.larger")}</ToggleButton>
        </ToggleButtonGroup>
      </Row>

      <Row label={t("settings.language")}>
        <RadioGroup
          aria-label={t("settings.language")}
          value={prefs.language}
          onChange={(value) => update({ language: value as LanguageChoice })}
        >
          <Radio value="system">{t("settings.language.system", { language: LANGUAGE_NAMES[systemLanguage()] })}</Radio>
          <Radio value="id" lang="id">
            {LANGUAGE_NAMES.id}
          </Radio>
          <Radio value="en" lang="en">
            {LANGUAGE_NAMES.en}
          </Radio>
        </RadioGroup>
      </Row>
    </div>
  );
}

function AboutTab() {
  const { t } = useT();
  const [version, setVersion] = useState<string>();

  useEffect(() => {
    if (isTauri()) getVersion().then(setVersion).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <img src="/rantakit.svg" alt="" className="size-16" />
      <div className="flex flex-col">
        <span className="font-display text-dialog">Rantakit</span>
        <span className="text-small text-text-muted">
          {version ? t("about.version", { version }) : t("about.devVersion")}
        </span>
      </div>
      <p className="max-w-xs">{t("about.tagline")}</p>
      <p className="max-w-xs text-small text-text-muted">
        {t("about.license")} <Link onPress={() => openExternal(LICENSE_URL)}>{t("about.viewLicense")}</Link>
      </p>
    </div>
  );
}

interface SettingsPanelProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsPanel({ tab, onTabChange }: SettingsPanelProps) {
  const { t } = useT();
  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => onTabChange(key as SettingsTab)}>
      <TabList aria-label={t("settings.title")}>
        <Tab id="general">{t("settings.tab.general")}</Tab>
        <Tab id="about">{t("settings.tab.about")}</Tab>
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
