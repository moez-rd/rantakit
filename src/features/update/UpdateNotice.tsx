import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CircleArrowDown } from "@keyline-icons/react";
import { Button as AriaButton, DialogTrigger } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import { Dialog, Heading } from "@/components/ui/Dialog";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/i18n";
import { DOWNLOAD_URL, openExternal } from "@/lib/links";
import { isAndroidApp } from "@/lib/platform";
import { focusRing, tv } from "@/lib/react-aria-utils";

/** Mirrors `NewVersion` in src-tauri/src/commands/update.rs. */
interface NewVersion {
  version: string;
  /** False for the Linux .deb and .rpm and for Android, which update through the download page. */
  canInstall: boolean;
}

/** The launch's one check; on Android the notice is on Home, which mounts again after each Tool page. */
let check: Promise<NewVersion | null> | undefined;

/** Null until a newer version is found. */
function useNewVersion() {
  const [found, setFound] = useState<NewVersion | null>(null);
  useEffect(() => {
    // Offline, or the check is off: say nothing. There is always the next launch.
    check ??= invoke<NewVersion | null>("check_update").catch(() => null);
    check.then(setFound);
  }, []);
  return found;
}

const notice = tv({
  extend: focusRing,
  base: [
    "flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-small font-semibold",
    "bg-brand-soft text-brand-strong cursor-default select-none transition-opacity",
    "hover:opacity-80 pressed:opacity-70",
  ],
});

/**
 * "Versi baru": a quiet button once a newer Rantakit is out, in the title bar
 * on desktop and at the top of Home on Android, opening a dialog to install
 * it. `busy` holds the install back while a Task runs, since installing
 * restarts the app.
 */
export function UpdateNotice({ busy, className }: { busy: boolean; className?: string }) {
  const { t } = useT();
  const found = useNewVersion();
  if (!found) return null;
  return (
    <DialogTrigger>
      <AriaButton className={(rp) => notice({ ...rp, className })}>
        <CircleArrowDown aria-hidden className="size-4" />
        {t("update.notice")}
      </AriaButton>
      <Modal isDismissable>
        <UpdateDialog found={found} busy={busy} />
      </Modal>
    </DialogTrigger>
  );
}

function UpdateDialog({ found, busy }: { found: NewVersion; busy: boolean }) {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "installing" | "failed">("idle");
  const install = () => {
    setState("installing");
    // On success the app restarts, so only a failure comes back.
    invoke("install_update").catch(() => setState("failed"));
  };
  const viaDownloadPage = !found.canInstall || state === "failed";
  const body =
    state === "failed"
      ? "update.failed"
      : found.canInstall
        ? "update.body"
        : isAndroidApp
          ? "update.body.apk"
          : "update.body.download";

  return (
    <Dialog>
      {({ close }) => (
        <>
          <Heading slot="title" className="my-0 font-display text-dialog">
            {t("update.title", { version: found.version })}
          </Heading>
          <p className="mt-3 text-text-muted">{t(body)}</p>
          {busy && !viaDownloadPage && <p className="mt-2 text-small text-text-muted">{t("update.busy")}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" isDisabled={state === "installing"} onPress={close}>
              {t("update.later")}
            </Button>
            {viaDownloadPage ? (
              <Button
                onPress={() => {
                  openExternal(DOWNLOAD_URL);
                  close();
                }}
              >
                {t("update.download")}
              </Button>
            ) : (
              <Button autoFocus isDisabled={busy} isPending={state === "installing"} onPress={install}>
                {t("update.install")}
              </Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
