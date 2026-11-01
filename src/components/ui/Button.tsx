'use client';
import {focusRing, tv} from '@/lib/react-aria-utils';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps
} from 'react-aria-components/Button';

export interface ButtonProps extends RACButtonProps {
  /**
   * Primary is the one main action of a screen, Danger only confirms inside a
   * dialog, Link is a quiet text action, and Icon is a 44 px icon-only button
   * that needs an `aria-label`.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | 'icon';
  /** Main actions are 48 px tall, actions inside a row 40 px. @default 'main' */
  size?: 'main' | 'row';
}

const BOXED: ('primary' | 'secondary' | 'danger')[] = ['primary', 'secondary', 'danger'];

let button = tv({
  extend: focusRing,
  base: 'relative inline-flex items-center justify-center gap-2 shrink-0 box-border border border-transparent font-sans text-label text-center whitespace-nowrap transition-colors cursor-default [-webkit-tap-highlight-color:transparent]',
  variants: {
    variant: {
      primary: 'bg-primary hover:bg-primary-hover text-on-primary font-bold',
      secondary: 'border-border-strong bg-surface hover:bg-badge-bg text-text',
      danger: 'bg-danger hover:bg-danger-hover text-on-danger font-bold',
      link: 'min-h-10 rounded-[10px] px-1 text-brand-strong hover:underline underline-offset-4',
      icon: 'size-11 rounded-[10px] text-text-muted hover:bg-badge-bg hover:text-text'
    },
    size: {
      main: '',
      row: ''
    },
    isDisabled: {
      true: 'text-text-disabled hover:no-underline forced-colors:text-[GrayText]'
    }
  },
  compoundVariants: [
    {variant: BOXED, size: 'main', class: 'min-h-12 rounded-xl px-5'},
    {variant: BOXED, size: 'row', class: 'min-h-10 rounded-[10px] px-3.5'},
    {variant: BOXED, isDisabled: true, class: 'border-transparent bg-badge-bg hover:bg-badge-bg'},
    {variant: 'icon', isDisabled: true, class: 'hover:bg-transparent'}
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'main'
  }
});

export function Button({variant, size, ...props}: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({...renderProps, variant, size, className})
      )}>
      {composeRenderProps(props.children, (children, {isPending}) => (
        <>
          {isPending && <Spinner />}
          {children}
        </>
      ))}
    </RACButton>
  );
}

/** The working state: a spinner before the label, which stays visible. */
function Spinner() {
  return (
    <svg
      aria-hidden
      className="size-[18px] animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
      <path d="M21 12A9 9 0 0 0 12 3" />
    </svg>
  );
}
