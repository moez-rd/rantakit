'use client';
import React, {useContext} from 'react';
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext,
  Heading,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps
} from 'react-aria-components/Disclosure';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {Button} from '@/components/ui/Button';
import {tv} from 'tailwind-variants';
import {ChevronRight} from 'lucide-react';
import {composeTailwindRenderProps} from '@/lib/react-aria-utils';

const disclosure = tv({
  base: 'group min-w-50 font-sans rounded-lg text-text'
});

const chevron = tv({
  base: 'w-4 h-4 text-text-muted transition-transform duration-200 ease-in-out',
  variants: {
    isExpanded: {
      true: 'transform rotate-90'
    },
    isDisabled: {
      true: 'text-text-disabled forced-colors:text-[GrayText]'
    }
  }
});

export interface DisclosureProps extends AriaDisclosureProps {
  children: React.ReactNode;
}

export function Disclosure({children, ...props}: DisclosureProps) {
  return (
    <AriaDisclosure
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        disclosure({...renderProps, className})
      )}>
      {children}
    </AriaDisclosure>
  );
}

export interface DisclosureHeaderProps {
  children: React.ReactNode;
}

export function DisclosureHeader({children}: DisclosureHeaderProps) {
  let {isExpanded} = useContext(DisclosureStateContext)!;
  return (
    <Heading className="text-lg font-semibold m-0">
      <Button slot="trigger" variant="quiet" className="w-full justify-start font-medium">
        {({isDisabled}) => (
          <>
            <ChevronRight aria-hidden className={chevron({isExpanded, isDisabled})} />
            <span>{children}</span>
          </>
        )}
      </Button>
    </Heading>
  );
}

export interface DisclosurePanelProps extends AriaDisclosurePanelProps {
  children: React.ReactNode;
}

export function DisclosurePanel({children, ...props}: DisclosurePanelProps) {
  return (
    <AriaDisclosurePanel
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'h-(--disclosure-panel-height) motion-safe:transition-[height] overflow-clip'
      )}>
      <div className="px-4 py-2">{children}</div>
    </AriaDisclosurePanel>
  );
}
