// Standardized admin layout dimensions.
// Use these tokens instead of ad-hoc w-14 / w-64 / 17.5rem values.

export const ADMIN_RAIL_WIDTH_REM = 3.5;   // w-14 — icon rail
export const ADMIN_SUBPANEL_WIDTH_REM = 14; // w-56 — sub-panel
export const ADMIN_SIDEBAR_WIDTH_REM =
  ADMIN_RAIL_WIDTH_REM + ADMIN_SUBPANEL_WIDTH_REM; // 17.5rem — expanded total

export const ADMIN_SIDEBAR_STYLE = {
  ['--sidebar-width' as string]: `${ADMIN_SIDEBAR_WIDTH_REM}rem`,
  ['--sidebar-width-icon' as string]: `${ADMIN_RAIL_WIDTH_REM}rem`,
} as React.CSSProperties;

// Tailwind class tokens (kept in sync with the rem values above)
export const ADMIN_RAIL_CLASS = 'w-14';       // 3.5rem
export const ADMIN_SUBPANEL_CLASS = 'w-56';   // 14rem
export const ADMIN_CONTENT_MAX = 'max-w-[1400px]';
export const ADMIN_CONTENT_PX = 'px-4 md:px-8';
