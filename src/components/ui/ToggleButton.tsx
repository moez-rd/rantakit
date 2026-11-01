'use client';
import {focusRing, tv} from '@/lib/react-aria-utils';
import {
  ToggleButton as RACToggleButton,
  type ToggleButtonProps
} from 'react-aria-components/ToggleButton';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';

let styles = tv({
  extend: focusRing,
  base: 'relative inline-flex items-center justify-center gap-2 border h-9 box-border px-3.5 [&:has(>svg:only-child)]:px-0 [&:has(>svg:only-child)]:h-8 [&:has(>svg:only-child)]:aspect-square font-sans text-label text-center transition rounded-lg cursor-default forced-color-adjust-none [-webkit-tap-highlight-color:transparent]',
  variants: {
    isSelected: {
      false:
        'border-transparent bg-transparent text-text-muted hover:text-text forced-colors:bg-[ButtonFace]! forced-colors:text-[ButtonText]!',
      true: 'border-border bg-surface text-text forced-colors:bg-[Highlight]! forced-colors:text-[HighlightText]!'
    },
    isDisabled: {
      true: 'border-transparent bg-badge-bg forced-colors:bg-[ButtonFace]! text-text-disabled forced-colors:text-[GrayText]!'
    }
  }
});

export function ToggleButton(props: ToggleButtonProps) {
  return (
    <RACToggleButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({...renderProps, className})
      )}
    />
  );
}
