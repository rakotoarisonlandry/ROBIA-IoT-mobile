/** Robia IoT colors (fixed). Everything else in the UI may evolve. */
export const Brand = {
  orange: '#FF6600',
  orangeDark: '#D65A00',
  orangeLight: '#FFF0E5',
  orangeSoft: '#FFF8F2',
  orangeBorder: '#FFD9BF',
  ink: '#202124',
  inkStrong: '#292929',
  textSecondary: '#60646C',
  textTertiary: '#85858A',
  canvas: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceSubtle: '#F0F0F3',
  border: '#ECEEF0',
  white: '#FFFFFF',
  backdrop: 'rgba(17,20,25,0.55)',
} as const;

export const BRAND_ORANGE = Brand.orange;

export const Radius = { sm: 10, md: 14, control: 16, card: 24, lg: 28, xl: 32, pill: 999 } as const;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, screen: 20 } as const;

/** Minimum touch target recommended for mobile controls. */
export const TOUCH = 44;

export const Elevation = {
  card: { boxShadow: '0px 6px 24px rgba(32,33,36,0.06), 0px 1px 2px rgba(32,33,36,0.04)' },
  raised: { boxShadow: '0px 12px 32px rgba(32,33,36,0.10), 0px 2px 6px rgba(32,33,36,0.05)' },
  floating: { boxShadow: '0px 16px 40px rgba(32,33,36,0.16), 0px 2px 8px rgba(32,33,36,0.06)' },
  glow: { boxShadow: '0px 10px 24px rgba(255,102,0,0.30)' },
} as const;

/** Status colors always come with a text label. */
export const Tone = {
  success: { bg: '#E8F7EE', fg: '#278251' },
  warning: { bg: '#FFF2DF', fg: '#A96707' },
  danger: { bg: '#FFF0EF', fg: '#BE554E' },
  neutral: { bg: '#F0F0F3', fg: '#60646C' },
} as const;
export type ToneName = keyof typeof Tone;
