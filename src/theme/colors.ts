// Caddie EDC — Brand Color System
// Navy, Slate, White. Industrial. No gradients, no shadows.

export const colors = {
  // Primary brand
  navy: '#1B2A4A',
  navyLight: '#243B5D',
  
  // Secondary
  slate: '#4A5568',
  slateLight: '#718096',
  
  // Neutrals
  white: '#FFFFFF',
  ice: '#F7FAFC',
  steel: '#A0AEC0',
  
  // Status
  forest: '#38A169',
  amber: '#D69E2E',
  rust: '#E53E3E',
  
  // Backgrounds (dark mode default for field use)
  bg: '#1B2A4A',
  bgCard: '#243B5D',
  bgCardPressed: '#2D4A6F',
  bgInput: '#243B5D',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  
  // Borders
  border: '#3D5A80',
  borderLight: '#4A6FA5',
  
  // Action type accents (subtle, not garish)
  actionCall: '#38A169',
  actionEmail: '#63B3ED',
  actionSms: '#D69E2E',
  actionResearch: '#B794F4',
} as const;

export type ColorKey = keyof typeof colors;
