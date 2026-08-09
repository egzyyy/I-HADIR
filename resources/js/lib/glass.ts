/**
 * Frosted-glass surfaces for the public landing chrome.
 *
 * Each recipe pairs a near-opaque base with a translucent
 * `supports-[backdrop-filter]` override. Browsers without backdrop-filter keep
 * the solid background — otherwise the bar would sit near-transparent over
 * scrolling content and the links would be unreadable.
 *
 * `backdrop-saturate-150` keeps colour passing through the glass from looking
 * washed out, which plain blur alone tends to cause.
 */

/** Sticky top navigation bar. */
export const glassNav =
  'bg-[#fcfafa]/95 supports-[backdrop-filter]:bg-[#fcfafa]/70 ' +
  'backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/70 shadow-sm';

/** Full-width mobile menu that drops directly beneath the nav. */
export const glassPanel =
  'bg-white/95 supports-[backdrop-filter]:bg-white/80 ' +
  'backdrop-blur-xl backdrop-saturate-150 border-t border-gray-200/70';

/**
 * Small floating desktop dropdowns. Kept denser than the nav — menu items are
 * dense text and need more contrast than a decorative bar does.
 */
export const glassDropdown =
  'bg-white/95 supports-[backdrop-filter]:bg-white/90 ' +
  'backdrop-blur-md backdrop-saturate-150';
