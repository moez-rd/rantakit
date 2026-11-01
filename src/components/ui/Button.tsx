'use client';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps
} from 'react-aria-components/Button';
import {tv} from 'tailwind-variants';
import {focusRing} from '@/lib/react-aria-utils';

export interface ButtonProps extends RACButtonProps {
  /** @default 'primary' */
  variant?: 'primary' | 'secondary' | 'destructive' | 'quiet';
}

let button = tv({
  extend: focusRing,
  base: 'relative inline-flex items-center justify-center gap-2 flex-shrink-0 border border-transparent h-9 box-border px-3.5 py-0 [&:has(>svg:only-child)]:px-0 [&:has(>svg:only-child)]:h-8 [&:has(>svg:only-child)]:w-8 font-sans text-sm text-center transition rounded-lg cursor-default [-webkit-tap-highlight-color:transparent]',
  variants: {
    variant: {
      primary: 'bg-primary hover:bg-primary-hover text-on-primary',
      secondary: 'border-border-strong bg-surface hover:bg-badge-bg text-text',
      destructive: 'bg-danger hover:bg-danger-hover text-on-danger',
      quiet: 'border-0 bg-transparent hover:bg-badge-bg text-text-muted hover:text-text'
    },
    isDisabled: {
      true: 'border-transparent bg-badge-bg text-text-disabled forced-colors:text-[GrayText]'
    },
    isPending: {
      true: 'text-transparent'
    }
  },
  defaultVariants: {
    variant: 'primary'
  },
  compoundVariants: [
    {
      variant: 'quiet',
      isDisabled: true,
      class: 'bg-transparent'
    }
  ]
});

export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({...renderProps, variant: props.variant, className})
      )}>
      {composeRenderProps(props.children, (children, {isPending}) => (
        <>
          {children}
          {isPending && (
            <span aria-hidden className="flex absolute inset-0 justify-center items-center">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" fill="none" className="opacity-25" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  pathLength="100"
                  strokeDasharray="60 140"
                  strokeDashoffset="0"
                />
              </svg>
            </span>
          )}
        </>
      ))}
    </RACButton>
  );
}
