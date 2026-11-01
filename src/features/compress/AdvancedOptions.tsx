import type { ReactNode } from "react";
import { Disclosure, DisclosureHeader, DisclosurePanel } from "@/components/ui/Disclosure";
import { useT } from "@/i18n";
import { useStoredState } from "@/lib/storedState";

const parse = (stored: unknown) => ({ open: (stored as { open?: unknown } | null)?.open === true });

/** "Opsi lanjutan": the only place for quality and pixel sizes. Stays open or closed between batches. */
export function AdvancedOptions({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [{ open }, update] = useStoredState("rantakit.advancedOptions", parse);
  return (
    <Disclosure isExpanded={open} onExpandedChange={(open) => update({ open })} className="px-4 py-3">
      <DisclosureHeader>{t("options.advanced")}</DisclosureHeader>
      <DisclosurePanel>
        <div className="-mx-4 flex flex-col divide-y divide-border">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
