import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {extendTailwindMerge} from 'tailwind-merge';
import {createTV} from 'tailwind-variants';

/**
 * Teaches tailwind-merge the six text styles from index.css, so `text-small`
 * is read as a size and never dropped in favour of a `text-<color>` class.
 */
const twMergeConfig = {
  extend: {
    theme: {
      text: ['title', 'dialog', 'section', 'body', 'label', 'small', 'wordmark']
    }
  }
};

export const twMerge = extendTailwindMerge(twMergeConfig);
export const tv = createTV({twMergeConfig});

export const focusRing = tv({
  base: 'outline outline-brand-strong forced-colors:outline-[Highlight] outline-offset-2',
  variants: {
    isFocusVisible: {
      false: 'outline-0',
      true: 'outline-2'
    }
  }
});

export function composeTailwindRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tw: string
): string | ((v: T) => string) {
  return composeRenderProps(className, className => twMerge(tw, className));
}
