'use client';
import {
  Slider as AriaSlider,
  type SliderProps as AriaSliderProps,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  SliderFill
} from 'react-aria-components/Slider';
import {tv} from 'tailwind-variants';
import {Label} from '@/components/ui/Field';
import {composeTailwindRenderProps, focusRing} from '@/lib/react-aria-utils';

const trackStyles = tv({
  base: 'relative rounded-full',
  variants: {
    orientation: {
      horizontal: 'w-full h-[6px]',
      vertical: 'h-full w-[6px] ml-[50%] -translate-x-[50%]'
    },
    isDisabled: {
      false: 'bg-track forced-colors:bg-[ButtonBorder]',
      true: 'bg-track forced-colors:bg-[ButtonBorder]'
    }
  }
});

const fillStyles = tv({
  base: 'rounded-full',
  variants: {
    isDisabled: {
      false: 'bg-brand forced-colors:bg-[Highlight]',
      true: 'bg-track forced-colors:bg-[GrayText]'
    }
  }
});

const thumbStyles = tv({
  extend: focusRing,
  base: 'w-4.5 h-4.5 group-orientation-horizontal:mt-5 group-orientation-vertical:ml-2.5 rounded-full bg-badge-bg border border-border-strong',
  variants: {
    isDragging: {
      true: 'bg-track forced-colors:bg-[ButtonBorder]'
    },
    isDisabled: {
      true: 'border-border forced-colors:border-[GrayText]'
    }
  }
});

export interface SliderProps<T> extends AriaSliderProps<T> {
  /** Label for the slider. */
  label?: string;
  /** Aria labels for each thumb. */
  thumbLabels?: string[];
  /**
   * The offset from which to start the fill.
   *
   * @default 0
   */
  fillOffset?: number;
}

export function Slider<T extends number | number[]>({
  label,
  thumbLabels,
  fillOffset,
  ...props
}: SliderProps<T>) {
  return (
    <AriaSlider
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        'font-sans orientation-horizontal:grid orientation-vertical:flex grid-cols-[1fr_auto] flex-col items-center gap-2 orientation-horizontal:w-64 orientation-horizontal:max-w-[calc(100%-10px)]'
      )}>
      <Label>{label}</Label>
      <SliderOutput className="text-sm text-text-muted orientation-vertical:hidden" />
      <SliderTrack className="group col-span-2 orientation-horizontal:h-5 orientation-vertical:w-5 orientation-vertical:h-38 flex items-center">
        {({state, ...renderProps}) => (
          <>
            <div className={trackStyles(renderProps)}>
              <SliderFill offset={fillOffset} className={fillStyles(renderProps)} />
            </div>
            {state.values.map((_, i) => (
              <SliderThumb
                key={i}
                index={i}
                aria-label={thumbLabels?.[i]}
                className={thumbStyles}
              />
            ))}
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
}
