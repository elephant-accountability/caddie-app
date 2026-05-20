// Caddie dark theme — industrial palette from Blue Brand System v3
// Job site at 6 AM. Concrete grays, safety orange, hard-hat yellow, sky blue.

export const colors = {
  // Backgrounds
  bg: '#0A0F1C',
  bgCard: '#131A2B',
  bgCardPressed: '#1A2236',
  bgInput: '#1A2236',

  // Text
  textPrimary: '#E8ECF4',
  textSecondary: '#8B95A8',
  textMuted: '#5A6478',

  // Brand
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueDark: '#1D4ED8',

  // Action types
  actionCall: '#22C55E',
  actionEmail: '#3B82F6',
  actionResearch: '#A855F7',
  actionSms: '#F59E0B',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Borders
  border: '#1E293B',
  borderLight: '#334155',
} as const;

export type ColorKey = keyof typeof colors;
