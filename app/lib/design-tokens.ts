/**
 * Design Tokens - Centralized Design System
 * Based on Stock Market UI Kit style
 * Colors: Teal primary, Dark Gray cards, White backgrounds
 */

// ============================================
// COLOR PALETTE
// ============================================
export const colors = {
  // Primary: Teal/Turquoise
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80', // Light green for positive
    500: '#10b981', // Teal - Main brand color
    600: '#059669',
    700: '#047857',
  },

  // Secondary: Cyan/Turquoise (accents)
  secondary: {
    400: '#22d3ee', // Cyan
    500: '#06b6d4', // Turquoise - Button hover
    600: '#0891b2',
  },

  // Neutrals: Gray scale for cards, text, borders
  neutral: {
    50: '#f9fafb',  // Very light - backgrounds
    100: '#f3f4f6', // Light backgrounds
    200: '#e5e7eb', // Subtle borders
    300: '#d1d5db', // Medium borders
    400: '#9ca3af', // Secondary text
    500: '#6b7280', // Medium text
    600: '#4b5563', // Dark text
    700: '#374151', // Darker text
    800: '#1f2937', // Dark cards
    900: '#111827', // Very dark
  },

  // Dark mode cards
  dark: {
    card: '#1f2937',      // Dark gray card background
    surface: '#111827',   // Darker surface
    border: '#374151',    // Dark border
    text: '#f3f4f6',      // Light text on dark
  },

  // Semantic colors
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  error: '#ef4444',      // Red
  info: '#06b6d4',       // Cyan
};

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'Fira Code, monospace',
  },

  // Heading styles
  heading: {
    h1: {
      size: '32px',
      weight: 700,
      lineHeight: '40px',
      letterSpacing: '-0.5px',
    },
    h2: {
      size: '24px',
      weight: 700,
      lineHeight: '32px',
      letterSpacing: '-0.3px',
    },
    h3: {
      size: '20px',
      weight: 600,
      lineHeight: '28px',
      letterSpacing: '-0.2px',
    },
    h4: {
      size: '18px',
      weight: 600,
      lineHeight: '26px',
    },
  },

  // Body text
  body: {
    lg: {
      size: '16px',
      weight: 400,
      lineHeight: '24px',
    },
    base: {
      size: '14px',
      weight: 400,
      lineHeight: '20px',
    },
    sm: {
      size: '12px',
      weight: 400,
      lineHeight: '16px',
    },
  },

  // Button text
  button: {
    lg: {
      size: '16px',
      weight: 600,
      lineHeight: '24px',
    },
    base: {
      size: '14px',
      weight: 600,
      lineHeight: '20px',
    },
    sm: {
      size: '12px',
      weight: 600,
      lineHeight: '16px',
    },
  },

  // Label text
  label: {
    size: '12px',
    weight: 600,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  },
};

// ============================================
// SPACING
// ============================================
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: '150ms ease-in-out',
  base: '250ms ease-in-out',
  slow: '350ms ease-in-out',
};

// ============================================
// CSS VARIABLES (for use in CSS)
// ============================================
export const getCSSVariables = () => `
  :root {
    --color-primary: ${colors.primary[500]};
    --color-primary-600: ${colors.primary[600]};
    --color-secondary: ${colors.secondary[500]};
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};

    --color-neutral-50: ${colors.neutral[50]};
    --color-neutral-100: ${colors.neutral[100]};
    --color-neutral-200: ${colors.neutral[200]};
    --color-neutral-600: ${colors.neutral[600]};
    --color-neutral-800: ${colors.neutral[800]};

    --color-dark-card: ${colors.dark.card};
    --color-dark-text: ${colors.dark.text};

    --spacing-xs: ${spacing.xs};
    --spacing-sm: ${spacing.sm};
    --spacing-md: ${spacing.md};
    --spacing-lg: ${spacing.lg};

    --radius-md: ${borderRadius.md};
    --radius-lg: ${borderRadius.lg};

    --shadow-sm: ${shadows.sm};
    --shadow-md: ${shadows.md};
    --shadow-lg: ${shadows.lg};

    --transition: ${transitions.base};
  }
`;
