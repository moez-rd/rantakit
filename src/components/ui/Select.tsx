'use client';
import {composeTailwindRenderProps, focusRing, tv} from '@/lib/react-aria-utils';
import {ChevronDown} from 'lucide-react';
import React from 'react';
import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  ListBox,
  type ListBoxItemProps,
  SelectValue,
  type ValidationResult
} from 'react-aria-components/Select';
import {Description, FieldError, Label} from '@/components/ui/Field';
import {DropdownItem, DropdownSection, type DropdownSectionProps} from '@/components/ui/ListBox';
import {Popover} from '@/components/ui/Popover';

const styles = tv({
  extend: focusRing,
  base: 'flex items-center text-start gap-4 w-full font-sans border border-border cursor-default rounded-lg pl-3 pr-2 h-9 min-w-[180px] transition bg-badge-bg [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      false:
        'text-text hover:bg-badge-bg pressed:bg-badge-bg group-invalid:outline group-invalid:outline-danger forced-colors:group-invalid:outline-[Mark]',
      true: 'border-transparent text-text-disabled forced-colors:text-[GrayText] bg-badge-bg'
    }
  }
});

export interface SelectProps<T, M extends 'single' | 'multiple'> extends Omit<
  AriaSelectProps<T, M>,
  'children'
> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  items?: Iterable<T>;
  children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function Select<T, M extends 'single' | 'multiple' = 'single'>({
  label,
  description,
  errorMessage,
  children,
  items,
  ...props
}: SelectProps<T, M>) {
  return (
    <AriaSelect
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'group flex flex-col gap-1 relative font-sans'
      )}>
      {label && <Label>{label}</Label>}
      <Button className={styles}>
        <SelectValue className="flex-1 text-label font-medium">
          {({selectedText, defaultChildren}) => selectedText || defaultChildren}
        </SelectValue>
        <ChevronDown
          aria-hidden
          className="w-4 h-4 text-text-muted forced-colors:text-[ButtonText] group-disabled:text-text-disabled forced-colors:group-disabled:text-[GrayText]"
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox
          items={items}
          className="outline-hidden box-border p-1 max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]">
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return <DropdownItem {...props} />;
}

export function SelectSection<T>(props: DropdownSectionProps<T>) {
  return <DropdownSection {...props} />;
}
