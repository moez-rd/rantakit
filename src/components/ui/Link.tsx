'use client';
import {Link as AriaLink, type LinkProps as AriaLinkProps} from 'react-aria-components/Link';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {focusRing, tv} from '@/lib/react-aria-utils';

interface LinkProps extends AriaLinkProps {
  variant?: 'primary' | 'secondary';
}

const styles = tv({
  extend: focusRing,
  base: 'underline disabled:no-underline disabled:cursor-default forced-colors:disabled:text-[GrayText] transition rounded-xs [-webkit-tap-highlight-color:transparent]',
  variants: {
    variant: {
      primary:
        'text-brand-strong underline decoration-brand-strong/60 hover:decoration-brand-strong',
      secondary:
        'text-text underline decoration-text/50 hover:decoration-text'
    }
  },
  defaultVariants: {
    variant: 'primary'
  }
});

export function Link(props: LinkProps) {
  return (
    <AriaLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({...renderProps, className, variant: props.variant})
      )}
    />
  );
}
