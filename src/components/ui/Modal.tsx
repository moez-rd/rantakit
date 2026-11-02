'use client';
import {ModalOverlay, type ModalOverlayProps, Modal as RACModal} from 'react-aria-components/Modal';
import {tv} from '@/lib/react-aria-utils';

const overlayStyles = tv({
  base: 'absolute top-0 left-0 w-full h-(--page-height) isolate z-20 bg-backdrop text-center',
  variants: {
    isEntering: {
      true: 'animate-in fade-in duration-200 ease-out'
    },
    isExiting: {
      true: 'animate-out fade-out duration-200 ease-in'
    }
  }
});

const modalStyles = tv({
  base: 'font-sans w-full max-h-[calc(var(--visual-viewport-height)*.9)] rounded-[20px] bg-surface text-left align-middle text-text bg-clip-padding border border-border',
  variants: {
    size: {
      normal: 'max-w-[min(90vw,450px)]',
      wide: 'max-w-[min(90vw,560px)]',
      large: 'max-w-[min(92vw,800px)]'
    },
    isEntering: {
      true: 'animate-in zoom-in-105 ease-out duration-200'
    },
    isExiting: {
      true: 'animate-out zoom-out-95 ease-in duration-200'
    }
  }
});

export function Modal({size = 'normal', ...props}: ModalOverlayProps & {size?: 'normal' | 'wide' | 'large'}) {
  return (
    <ModalOverlay {...props} className={overlayStyles}>
      <div className="sticky top-0 left-0 w-full h-(--visual-viewport-height) flex items-center justify-center box-border">
        <RACModal {...props} className={(renderProps) => modalStyles({...renderProps, size})} />
      </div>
    </ModalOverlay>
  );
}
