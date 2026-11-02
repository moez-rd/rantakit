import { Heading } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Modal } from "@/components/ui/Modal";

interface LeaveDialogProps {
  title: string;
  body: string;
  /** The quiet button, which leaves. */
  leaveLabel: string;
  /** The main button, focused, which stays. */
  stayLabel: string;
  onLeave: () => void;
  onStay: () => void;
}

/** Asked before leaving a Tool page that still has files on it. Staying is the default. */
export function LeaveDialog({ title, body, leaveLabel, stayLabel, onLeave, onStay }: LeaveDialogProps) {
  return (
    <Modal isOpen isDismissable onOpenChange={(open) => !open && onStay()}>
      <Dialog role="alertdialog">
        <Heading slot="title" className="my-0 font-display text-dialog">
          {title}
        </Heading>
        <p className="mt-3 text-text-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onPress={onLeave}>
            {leaveLabel}
          </Button>
          <Button autoFocus onPress={onStay}>
            {stayLabel}
          </Button>
        </div>
      </Dialog>
    </Modal>
  );
}
