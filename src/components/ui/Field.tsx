'use client';
import {type FieldErrorProps, FieldError as RACFieldError} from 'react-aria-components/FieldError';
import {Group, type GroupProps} from 'react-aria-components/Group';
import {type InputProps, Input as RACInput} from 'react-aria-components/Input';
import {type LabelProps, Label as RACLabel} from 'react-aria-components/Label';
import {Text, type TextProps} from 'react-aria-components/Text';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {twMerge} from 'tailwind-merge';
import {tv} from 'tailwind-variants';
import {composeTailwindRenderProps, focusRing} from '@/lib/react-aria-utils';

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        'font-sans text-sm text-text-muted font-medium cursor-default w-fit',
        props.className
      )}
    />
  );
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge(
        'text-xs text-text-muted group-disabled:text-text-disabled contain-inline-size',
        props.className
      )}
    />
  );
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'text-xs text-danger contain-inline-size forced-colors:text-[Mark]'
      )}
    />
  );
}

export const fieldBorderStyles = tv({
  base: 'transition',
  variants: {
    isFocusWithin: {
      false:
        'border-border hover:border-border-strong forced-colors:border-[ButtonBorder]',
      true: 'border-border-strong forced-colors:border-[Highlight]'
    },
    isInvalid: {
      true: 'border-danger forced-colors:border-[Mark]'
    },
    isDisabled: {
      true: 'border-border forced-colors:border-[GrayText]'
    }
  }
});

export const fieldGroupStyles = tv({
  extend: focusRing,
  base: 'group flex items-center h-9 box-border bg-surface forced-colors:bg-[Field] border rounded-lg overflow-hidden transition',
  variants: fieldBorderStyles.variants
});

export function FieldGroup(props: GroupProps) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({...renderProps, className})
      )}
    />
  );
}

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'px-3 py-0 min-h-9 flex-1 min-w-0 border-0 outline outline-0 bg-surface font-sans text-sm text-text placeholder:text-text-muted disabled:text-text-disabled disabled:placeholder:text-text-disabled [-webkit-tap-highlight-color:transparent]'
      )}
    />
  );
}
