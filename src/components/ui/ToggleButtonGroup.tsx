'use client';
import {tv} from '@/lib/react-aria-utils';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps
} from 'react-aria-components/ToggleButtonGroup';

const styles = tv({
  base: 'flex gap-1 rounded-xl bg-track p-1',
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col'
    }
  }
});

export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  return (
    <RACToggleButtonGroup
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({...renderProps, className})
      )}
    />
  );
}
