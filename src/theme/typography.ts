import { Platform } from 'react-native';

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  sans: Platform.select({ ios: 'System', default: 'sans-serif' }),
} as const;

export const sizes = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 34,
} as const;
