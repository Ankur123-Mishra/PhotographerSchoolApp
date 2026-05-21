/**
 * Professional color palette – School ID Card App
 */
export const colors = {
  // Primary & brand
  primary: '#0f766e',
  primaryDark: '#0d9488',
  primaryLight: '#ccfbf1',
  primaryMuted: '#5eead4',

  // Neutrals
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textInverse: '#ffffff',

  // Status
  success: '#059669',
  successBg: '#d1fae5',
  warning: '#d97706',
  warningBg: '#ffedd5',
  error: '#dc2626',
  errorBg: '#fee2e2',
  info: '#0284c7',
  infoBg: '#e0f2fe',

  // Status badge (workflow)
  pending: { bg: '#f1f5f9', text: '#475569' },
  photo_uploaded: { bg: '#e0f2fe', text: '#0369a1' },
  preview_sent: { bg: '#ffedd5', text: '#c2410c' },
  correction_pending: { bg: '#fee2e2', text: '#b91c1c' },
  approved: { bg: '#d1fae5', text: '#047857' },
  printed: { bg: '#ede9fe', text: '#5b21b6' },
  delivered: { bg: '#ccfbf1', text: '#0f766e' },
  received_by_school: { bg: '#14532d', text: '#dcfce7' },
};

export const spacing = {
  xs: 4,
  sm: 7,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  titleSmall: { fontSize: 20, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
};
