export const mapableColors = {
  primary: "#005B7F",
  secondary: "#00A979",
  accent: "#F8C51C",
  destructive: "#B42318",
  backgroundLight: "#F7FBFC",
  backgroundDark: "#0B1C24",
  foregroundLight: "#0F172A",
  foregroundDark: "#F8FAFC",
  mutedLight: "#E8F1F5",
  mutedDark: "#16303B",
  borderLight: "#C9D8E0",
  borderDark: "#2A4A57",
} as const;

export const mapableSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const mapableTypography = {
  fontFamilySans: "SourceSans3",
  fontFamilyHeading: "Fraunces",
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
  lineHeights: {
    tight: 1.2,
    body: 1.5,
    relaxed: 1.7,
  },
} as const;

export const mapableRadii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const touchTargetMin = 48;

export const lightTheme = {
  mode: "light" as const,
  colors: {
    background: mapableColors.backgroundLight,
    foreground: mapableColors.foregroundLight,
    primary: mapableColors.primary,
    secondary: mapableColors.secondary,
    accent: mapableColors.accent,
    destructive: mapableColors.destructive,
    muted: mapableColors.mutedLight,
    border: mapableColors.borderLight,
    card: "#FFFFFF",
  },
  spacing: mapableSpacing,
  typography: mapableTypography,
  radii: mapableRadii,
};

export const darkTheme = {
  mode: "dark" as const,
  colors: {
    background: mapableColors.backgroundDark,
    foreground: mapableColors.foregroundDark,
    primary: "#4DB8D9",
    secondary: "#2FD39A",
    accent: mapableColors.accent,
    destructive: "#F97066",
    muted: mapableColors.mutedDark,
    border: mapableColors.borderDark,
    card: "#122833",
  },
  spacing: mapableSpacing,
  typography: mapableTypography,
  radii: mapableRadii,
};

export type MapableTheme = typeof lightTheme | typeof darkTheme;
