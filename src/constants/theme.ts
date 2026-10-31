/**
 * PocketLab Theme Constants
 * Dark UI, minimal clutter, prioritizes the photograph.
 */

export const Colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  border: '#333333',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  accent: '#4a9eff',
  accentHover: '#3a8eef',
  error: '#ff4444',
  success: '#44ff44',
  warning: '#ffaa44',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 32,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const HitSlop = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
} as const;
