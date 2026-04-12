/**
 * @a2ui/vue - Shared style utilities for basic catalog components.
 *
 * Copyright 2026 Google LLC
 */

/** Standard leaf margin. */
export const LEAF_MARGIN = '8px';

/** Standard container padding. */
export const CONTAINER_PADDING = '16px';

/** Standard border for cards and inputs. */
export const STANDARD_BORDER = '1px solid #ccc';

/** Standard border radius. */
export const STANDARD_RADIUS = '8px';

/** Maps A2UI justify values to CSS justify-content. */
export const mapJustify = (j?: string): string => {
  switch (j) {
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'spaceAround':
      return 'space-around';
    case 'spaceBetween':
      return 'space-between';
    case 'spaceEvenly':
      return 'space-evenly';
    case 'start':
      return 'flex-start';
    case 'stretch':
      return 'stretch';
    default:
      return 'flex-start';
  }
};

/** Maps A2UI align values to CSS align-items. */
export const mapAlign = (a?: string): string => {
  switch (a) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'stretch':
      return 'stretch';
    default:
      return 'stretch';
  }
};

/** Base styles for leaf components (text, icon, etc.). */
export const getBaseLeafStyle = (): Record<string, string> => ({
  margin: LEAF_MARGIN,
  boxSizing: 'border-box',
});

/** Base styles for container components (card, etc.). */
export const getBaseContainerStyle = (): Record<string, string> => ({
  margin: LEAF_MARGIN,
  padding: CONTAINER_PADDING,
  border: STANDARD_BORDER,
  borderRadius: STANDARD_RADIUS,
  boxSizing: 'border-box',
});
