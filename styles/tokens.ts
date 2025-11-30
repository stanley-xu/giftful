export const palette = {
  primary1: "hsl(81, 25%, 65%)",
  primary2: "hsl(148, 13%, 51%)",
  primary3: "hsl(162, 16%, 47%)",
  secondary: "hsl(9, 51%, 59%)",
  secondaryDark: "hsl(9, 51%, 43%)",
  offwhite: "hsl(45, 55%, 91%)",
  white: "hsl(0, 0%, 97%)",
  black: "hsl(0, 0%, 15%)",
  gray: "hsla(135, 15%, 15%, 0.7)",
} as const;

export const colours = {
  background: palette.white,
  backgroundWarm: palette.offwhite,
  surface: palette.primary1,
  surfaceWarm: palette.primary2,
  surfaceDark: palette.primary3,
  accent: palette.primary3,
  error: palette.secondary,
  text: palette.black,
  border: "hsl(0, 0%, 88%)",
} as const;

export const text = {
  black: palette.black,
  white: palette.white,
  gray: palette.gray,
} as const;

export const typography = {
  fontSize: {
    "2xs": 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Backward compatibility - keep default export for now
const TOKENS = {
  palette,
  colours,
  typography,
  spacing,
  borderRadius,
};

export default TOKENS;
