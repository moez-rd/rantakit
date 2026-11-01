'use client';
import {ChevronDown, ChevronUp} from '@keyline-icons/react';
import {
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  Button,
  type ButtonProps,
  type ValidationResult
} from 'react-aria-components/NumberField';
import {Description, FieldError, FieldGroup, Input, Label, fieldBorderStyles} from '@/components/ui/Field';
import {composeTailwindRenderProps} from '@/lib/react-aria-utils';

export interface NumberFieldProps extends AriaNumberFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

export function NumberField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1 font-sans'
      )}>
      <Label>{label}</Label>
      <FieldGroup>
        {renderProps => (
          <>
            <Input className="w-20" placeholder={placeholder} />
            <div
              className={fieldBorderStyles({
                ...renderProps,
                class: 'flex flex-col border-s h-full'
              })}>
              <StepperButton slot="increment">
                <ChevronUp aria-hidden className="w-4 h-4" />
              </StepperButton>
              <div className={fieldBorderStyles({...renderProps, class: 'border-b'})} />
              <StepperButton slot="decrement">
                <ChevronDown aria-hidden className="w-4 h-4" />
              </StepperButton>
            </div>
          </>
        )}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}

function StepperButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      className="flex border-0 py-0 px-0.5 flex-1 box-border cursor-default text-text-muted bg-transparent pressed:bg-badge-bg group-disabled:text-text-disabled forced-colors:group-disabled:text-[GrayText] [-webkit-tap-highlight-color:transparent]"
    />
  );
}
