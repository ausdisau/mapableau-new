/**
 * Semantic Token System
 *
 * Provides theme-aware token utilities for components.
 * Bridges accessibility preferences to CSS custom properties.
 */

import type { SemanticTokens } from "./accessibility-store";

/**
 * Apply semantic tokens to document root
 */
export function applySemanticTokensToDocument(tokens: SemanticTokens): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const style = root.style;

  // Colors
  style.setProperty("--a11y-color-text-primary", tokens.colors.textPrimary);
  style.setProperty("--a11y-color-text-secondary", tokens.colors.textSecondary);
  style.setProperty("--a11y-color-text-inverse", tokens.colors.textInverse);
  style.setProperty(
    "--a11y-color-background-primary",
    tokens.colors.backgroundPrimary
  );
  style.setProperty(
    "--a11y-color-background-secondary",
    tokens.colors.backgroundSecondary
  );
  style.setProperty("--a11y-color-focus", tokens.colors.focus);
  style.setProperty("--a11y-color-error", tokens.colors.error);
  style.setProperty("--a11y-color-success", tokens.colors.success);
  style.setProperty("--a11y-color-warning", tokens.colors.warning);

  // Typography
  style.setProperty(
    "--a11y-typography-scale",
    String(tokens.typography.scale)
  );
  style.setProperty(
    "--a11y-typography-font-family",
    tokens.typography.fontFamily
  );
  style.setProperty(
    "--a11y-typography-line-height",
    String(tokens.typography.lineHeightMultiplier)
  );
  style.setProperty(
    "--a11y-typography-letter-spacing",
    String(tokens.typography.letterSpacingMultiplier * 0.1) + "em"
  );

  // Motion
  style.setProperty(
    "--a11y-motion-reduced",
    tokens.motion.reduced ? "1" : "0"
  );

  // Focus
  style.setProperty("--a11y-focus-outline-width", tokens.focus.outlineWidth);
  style.setProperty("--a11y-focus-outline-style", tokens.focus.outlineStyle);
  style.setProperty("--a11y-focus-outline-color", tokens.focus.outlineColor);
}

/**
 * CSS string for color variables
 */
export function getSemanticColorsCss(tokens: SemanticTokens): string {
  return `
    --a11y-color-text-primary: ${tokens.colors.textPrimary};
    --a11y-color-text-secondary: ${tokens.colors.textSecondary};
    --a11y-color-text-inverse: ${tokens.colors.textInverse};
    --a11y-color-background-primary: ${tokens.colors.backgroundPrimary};
    --a11y-color-background-secondary: ${tokens.colors.backgroundSecondary};
    --a11y-color-focus: ${tokens.colors.focus};
    --a11y-color-error: ${tokens.colors.error};
    --a11y-color-success: ${tokens.colors.success};
    --a11y-color-warning: ${tokens.colors.warning};
  `;
}

/**
 * CSS string for typography variables
 */
export function getSemanticTypographyCss(tokens: SemanticTokens): string {
  return `
    --a11y-typography-scale: ${tokens.typography.scale};
    --a11y-typography-font-family: ${tokens.typography.fontFamily};
    --a11y-typography-line-height: ${tokens.typography.lineHeightMultiplier};
    --a11y-typography-letter-spacing: ${tokens.typography.letterSpacingMultiplier * 0.1}em;
  `;
}

/**
 * CSS string for focus variables
 */
export function getSemanticFocusCss(tokens: SemanticTokens): string {
  return `
    --a11y-focus-outline-width: ${tokens.focus.outlineWidth};
    --a11y-focus-outline-style: ${tokens.focus.outlineStyle};
    --a11y-focus-outline-color: ${tokens.focus.outlineColor};
  `;
}

/**
 * Get computed token value (for use in JavaScript)
 */
export function getComputedToken(
  path: keyof SemanticTokens,
  tokens: SemanticTokens
): any {
  const tokens_map: Record<string, any> = {
    colors: tokens.colors,
    typography: tokens.typography,
    motion: tokens.motion,
    focus: tokens.focus,
  };
  return tokens_map[path];
}

/**
 * Utility for accessing specific color tokens in components
 */
export const semanticColors = (tokens: SemanticTokens) => ({
  textPrimary: () => tokens.colors.textPrimary,
  textSecondary: () => tokens.colors.textSecondary,
  textInverse: () => tokens.colors.textInverse,
  backgroundPrimary: () => tokens.colors.backgroundPrimary,
  backgroundSecondary: () => tokens.colors.backgroundSecondary,
  focus: () => tokens.colors.focus,
  error: () => tokens.colors.error,
  success: () => tokens.colors.success,
  warning: () => tokens.colors.warning,
});

/**
 * Utility for accessing typography tokens
 */
export const semanticTypography = (tokens: SemanticTokens) => ({
  scale: () => tokens.typography.scale,
  fontFamily: () => tokens.typography.fontFamily,
  lineHeightMultiplier: () => tokens.typography.lineHeightMultiplier,
  letterSpacingMultiplier: () => tokens.typography.letterSpacingMultiplier,
  getFontSizePx: (baseSize: number) => baseSize * tokens.typography.scale,
  getLineHeight: (baseHeight: number) =>
    baseHeight * tokens.typography.lineHeightMultiplier,
  getLetterSpacing: () =>
    `${tokens.typography.letterSpacingMultiplier * 0.1}em`,
});

/**
 * Utility for accessing motion preferences
 */
export const semanticMotion = (tokens: SemanticTokens) => ({
  reduced: () => tokens.motion.reduced,
  prefersReducedMotion: () => tokens.motion.prefersReducedMotion,
  getTransition: (property = "all", duration = "0.3s") => {
    const dur = tokens.motion.reduced ? "0s" : duration;
    return `${property} ${dur} ease-in-out`;
  },
  getAnimation: (name: string, duration = "0.5s", iterationCount = 1) => {
    if (tokens.motion.reduced) return "none";
    return `${name} ${duration} ease-in-out ${iterationCount}`;
  },
});

/**
 * Utility for accessing focus preferences
 */
export const semanticFocus = (tokens: SemanticTokens) => ({
  outlineWidth: () => tokens.focus.outlineWidth,
  outlineStyle: () => tokens.focus.outlineStyle,
  outlineColor: () => tokens.focus.outlineColor,
  getOutlineStyle: () =>
    `${tokens.focus.outlineWidth} ${tokens.focus.outlineStyle} ${tokens.focus.outlineColor}`,
  getFocusRing: () =>
    `outline: ${tokens.focus.outlineWidth} ${tokens.focus.outlineStyle} ${tokens.focus.outlineColor}; outline-offset: 2px;`,
});

/**
 * Tailwind CSS class generation (if using Tailwind)
 */
export function getAccessibilityClasses(tokens: SemanticTokens): Record<string, string> {
  return {
    textPrimary: `text-[${tokens.colors.textPrimary}]`,
    textSecondary: `text-[${tokens.colors.textSecondary}]`,
    textInverse: `text-[${tokens.colors.textInverse}]`,
    backgroundPrimary: `bg-[${tokens.colors.backgroundPrimary}]`,
    backgroundSecondary: `bg-[${tokens.colors.backgroundSecondary}]`,
    focusColor: `focus:outline-[${tokens.colors.focus}]`,
    errorColor: `text-[${tokens.colors.error}]`,
    successColor: `text-[${tokens.colors.success}]`,
    warningColor: `text-[${tokens.colors.warning}]`,
  };
}
