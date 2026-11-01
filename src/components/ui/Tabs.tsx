'use client';
import {focusRing, tv, twMerge} from '@/lib/react-aria-utils';
import {
  Tab as RACTab,
  TabList as RACTabList,
  TabPanels as RACTabPanels,
  TabPanel as RACTabPanel,
  Tabs as RACTabs,
  type TabListProps,
  type TabPanelProps,
  type TabPanelsProps,
  type TabProps,
  type TabsProps
} from 'react-aria-components/Tabs';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';

const tabsStyles = tv({
  base: 'flex gap-4 font-sans max-w-full',
  variants: {
    orientation: {
      horizontal: 'flex-col',
      vertical: 'flex-row'
    }
  }
});

export function Tabs(props: TabsProps) {
  return (
    <RACTabs
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabsStyles({...renderProps, className})
      )}
    />
  );
}

const tabListStyles = tv({
  base: 'flex max-w-full p-1 -m-1 overflow-x-auto overflow-y-clip [scrollbar-width:none]',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col items-start'
    }
  }
});

export function TabList<T>(props: TabListProps<T>) {
  return (
    <RACTabList
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabListStyles({...renderProps, className})
      )}
    />
  );
}

const tabProps = tv({
  extend: focusRing,
  base: 'group relative flex items-center cursor-default rounded-full px-3 py-1.5 text-label font-medium transition text-text-muted hover:text-text selected:bg-brand-soft selected:text-brand-strong forced-color-adjust-none [-webkit-tap-highlight-color:transparent]',
  variants: {
    isDisabled: {
      true: 'text-text-disabled forced-colors:text-[GrayText] selected:bg-badge-bg forced-colors:selected:text-[HighlightText] forced-colors:selected:bg-[GrayText]'
    }
  }
});

export function Tab(props: TabProps) {
  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabProps({...renderProps, className})
      )}
    />
  );
}

export function TabPanels<T>(props: TabPanelsProps<T>) {
  return (
    <RACTabPanels
      {...props}
      className={twMerge(
        'relative h-(--tab-panel-height) motion-safe:transition-[height] overflow-clip',
        props.className
      )}
    />
  );
}

const tabPanelStyles = tv({
  extend: focusRing,
  base: 'flex-1 box-border p-4 text-label text-text transition entering:opacity-0 exiting:opacity-0 exiting:absolute exiting:top-0 exiting:left-0 exiting:w-full'
});

export function TabPanel(props: TabPanelProps) {
  return (
    <RACTabPanel
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabPanelStyles({...renderProps, className})
      )}
    />
  );
}
