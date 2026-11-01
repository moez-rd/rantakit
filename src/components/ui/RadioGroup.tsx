'use client';
import {type ReactNode} from 'react';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {
  RadioField,
  RadioButton,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioFieldProps,
  type ValidationResult
} from 'react-aria-components/RadioGroup';
import {tv} from 'tailwind-variants';
import {Description, FieldError, Label} from '@/components/ui/Field';
import {composeTailwindRenderProps, focusRing} from '@/lib/react-aria-utils';

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'> {
  label?: string;
  children?: ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function RadioGroup(props: RadioGroupProps) {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-2 font-sans'
      )}>
      <Label>{props.label}</Label>
      <div className="flex group-orientation-vertical:flex-col gap-2 group-orientation-horizontal:gap-4">
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  );
}

const styles = tv({
  extend: focusRing,
  base: 'w-4.5 h-4.5 flex-shrink-0 box-border rounded-full border bg-surface transition-all',
  variants: {
    isSelected: {
      false:
        'border-border-strong group-pressed:border-border-strong',
      true: 'border-[calc(var(--spacing)*1.5)] border-brand-strong forced-colors:border-[Highlight]!'
    },
    isInvalid: {
      true: 'border-danger group-pressed:border-danger forced-colors:border-[Mark]!'
    },
    isDisabled: {
      true: 'border-border forced-colors:border-[GrayText]!'
    }
  }
});

export interface RadioProps extends RadioFieldProps {
  description?: string;
}

export function Radio(props: RadioProps) {
  return (
    <RadioField {...props} className="flex flex-col gap-1 group">
      <RadioButton
        className={composeTailwindRenderProps(
          props.className,
          'flex relative gap-2 items-center group text-text disabled:text-text-disabled forced-colors:disabled:text-[GrayText] text-sm transition [-webkit-tap-highlight-color:transparent]'
        )}>
        {composeRenderProps(props.children, (children, renderProps) => (
          <>
            <div className={styles(renderProps)} />
            {children}
          </>
        ))}
      </RadioButton>
      {props.description && <Description className="ms-6.5">{props.description}</Description>}
    </RadioField>
  );
}
