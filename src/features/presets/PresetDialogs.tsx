import { useState } from "react";
import { Bin } from "@keyline-icons/react";
import { Form, Heading, TextField } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Description, FieldGroup, Input, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/i18n";
import type { Preset } from "./presetsApi";

/** "Simpan sebagai preset": asks for a name, then saves the current options under it. */
export function SavePresetDialog({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const blank = name.trim() === "";
  return (
    <Modal isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Dialog>
        <Heading slot="title" className="my-0 font-display text-dialog">
          {t("preset.save")}
        </Heading>
        <Form
          className="mt-4 flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!blank) onSave(name.trim());
          }}
        >
          <TextField autoFocus value={name} onChange={setName} className="flex flex-col gap-1.5">
            <Label>{t("preset.name")}</Label>
            <FieldGroup className="h-11">
              <Input className="min-h-11 w-full" />
            </FieldGroup>
            <Description>{t("preset.name.hint")}</Description>
          </TextField>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isDisabled={blank}>
              {t("common.save")}
            </Button>
          </div>
        </Form>
      </Dialog>
    </Modal>
  );
}

interface ManagePresetsDialogProps {
  presets: Preset[];
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

/** "Kelola preset": rename a Preset by editing its name, or delete it. */
export function ManagePresetsDialog({ presets, onRename, onRemove, onClose }: ManagePresetsDialogProps) {
  const { t } = useT();
  return (
    <Modal isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Dialog>
        <Heading slot="title" className="my-0 font-display text-dialog">
          {t("preset.manage")}
        </Heading>
        {presets.length === 0 ? (
          <p className="mt-3 text-text-muted">{t("preset.manage.empty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {presets.map((preset) => (
              <li key={preset.id} className="flex items-center gap-2">
                <PresetName preset={preset} onRename={(name) => onRename(preset.id, name)} />
                <Button
                  variant="icon"
                  aria-label={t("preset.remove", { name: preset.name })}
                  onPress={() => onRemove(preset.id)}
                >
                  <Bin aria-hidden className="size-5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex justify-end">
          <Button onPress={onClose}>{t("common.done")}</Button>
        </div>
      </Dialog>
    </Modal>
  );
}

/** A Preset's name, saved when the field loses focus or Enter is pressed; a blank name is put back. */
function PresetName({ preset, onRename }: { preset: Preset; onRename: (name: string) => void }) {
  const { t } = useT();
  const [name, setName] = useState(preset.name);
  const commit = () => {
    const trimmed = name.trim();
    if (trimmed === "") setName(preset.name);
    else if (trimmed !== preset.name) onRename(trimmed);
  };
  return (
    <TextField
      aria-label={t("preset.nameOf", { name: preset.name })}
      value={name}
      onChange={setName}
      onBlur={commit}
      onKeyDown={(event) => event.key === "Enter" && commit()}
      className="min-w-0 flex-1"
    >
      <FieldGroup className="h-11">
        <Input className="min-h-11 w-full" />
      </FieldGroup>
    </TextField>
  );
}
