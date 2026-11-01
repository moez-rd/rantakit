'use client';
import {CircleAlert, Info} from '@keyline-icons/react';
import {type ReactNode} from 'react';
import {chain} from 'react-aria/chain';
import {type DialogProps} from 'react-aria-components/Dialog';
import {Heading} from 'react-aria-components/Heading';
import {Button} from '@/components/ui/Button';
import {Dialog} from '@/components/ui/Dialog';

interface AlertDialogProps extends Omit<DialogProps, 'children'> {
  title: string;
  children: ReactNode;
  variant?: 'info' | 'danger';
  actionLabel: string;
  cancelLabel: string;
  onAction?: () => void;
}

export function AlertDialog({
  title,
  variant,
  cancelLabel,
  actionLabel,
  onAction,
  children,
  ...props
}: AlertDialogProps) {
  return (
    <Dialog role="alertdialog" {...props}>
      {({close}) => (
        <>
          <Heading slot="title" className="font-display text-dialog my-0">
            {title}
          </Heading>
          <div
            className={`w-6 h-6 absolute right-6 top-6 stroke-2 ${variant === 'danger' ? 'text-danger' : 'text-brand-strong'}`}>
            {variant === 'danger' ? <CircleAlert aria-hidden /> : <Info aria-hidden />}
          </div>
          <p className="mt-3 text-text-muted">{children}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onPress={close}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              autoFocus
              onPress={chain(onAction, close)}>
              {actionLabel}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
