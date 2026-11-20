/**
 * Canonical MapAble palette — single source of truth for @mapable/ui.
 *
 * AAA pair rules (WCAG 2.2 1.4.6 / 1.4.11):
 * - Normal text on white/surface ≥ 7:1
 * - Large text / UI components ≥ 4.5:1 (we still target ≥7:1 where practical)
 * - brandGreen (#00A979) is decorative / non-text only — use brandGreenText for copy
 * - brandYellow (#F8C51C) is restricted to navy/dark surfaces (fails on white at 1.62:1)
 */

export const mapableColors = {
  navy: "#0C1833",
  brandBlue: "#005B7F",
  /** Darker blue for small/dense text needing extra AAA margin beyond brandBlue (7.49:1). */
  brandBlueDark: "#004766",
  /** AAA-safe blue for dark-mode text/links on near-navy backgrounds. */
  brandBlueOnDark: "#93C5FD",
  brandYellow: "#F8C51C",
  /** Non-text / decorative green only — do not use for body copy on white. */
  brandGreen: "#00A979",
  /** Green text on white/surface — ≥7:1 (measured ~8.26:1). */
  brandGreenText: "#005A42",
  /** Minimum body text on white (slate-700) — ≥7:1. */
  bodyText: "#334155",
  /** Muted supporting text on white — ≥7:1 (slate-600). */
  mutedText: "#475569",
  surface: "#F6FBFC",
  white: "#FFFFFF",
} as const;

/** Documented foreground/background pairs that must stay AAA in CI. */
export const mapableAaaContrastPairs = [
  { name: "navy on white", fg: mapableColors.navy, bg: mapableColors.white, min: 7 },
  { name: "brandBlue on white", fg: mapableColors.brandBlue, bg: mapableColors.white, min: 7 },
  { name: "brandBlueDark on white", fg: mapableColors.brandBlueDark, bg: mapableColors.white, min: 7 },
  { name: "brandGreenText on white", fg: mapableColors.brandGreenText, bg: mapableColors.white, min: 7 },
  { name: "bodyText on white", fg: mapableColors.bodyText, bg: mapableColors.white, min: 7 },
  { name: "mutedText on white", fg: mapableColors.mutedText, bg: mapableColors.white, min: 7 },
  { name: "brandYellow on navy", fg: mapableColors.brandYellow, bg: mapableColors.navy, min: 7 },
  { name: "white on brandBlue", fg: mapableColors.white, bg: mapableColors.brandBlue, min: 4.5 },
  { name: "white on navy", fg: mapableColors.white, bg: mapableColors.navy, min: 7 },
  {
    name: "brandBlueOnDark on navy",
    fg: mapableColors.brandBlueOnDark,
    bg: mapableColors.navy,
    min: 7,
  },
] as const;

/** Relative luminance (sRGB). */
export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) throw new Error(`Expected #RRGGBB, got ${hex}`);
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** WCAG contrast ratio between two #RRGGBB colours. */
export function contrastRatio(foreground: string, background: string): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Dual focus ring for 2.4.13 Focus Appearance:
 * brand-blue ring (≥2px) + yellow offset so the indicator contrasts ≥3:1
 * against both light and navy-adjacent surfaces.
 */
export const mapableAaaFocusRingClass =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]";

/** @deprecated Prefer mapableAaaFocusRingClass — yellow-only fails 2.4.13 on white. */
export const mapableCareFocusRing = mapableAaaFocusRingClass;

export const mapableInteractiveFocusRing = mapableAaaFocusRingClass;

export const mapableCareFocusRingSubtle =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]/80";

export const mapableCareBodyClass = "mapable-soft text-[#334155]";

export const mapableCarePageBgClass = "bg-white";

export const mapableCareCtaClass =
  "rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]";

export const mapableCareOutlineCtaClass =
  "rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]";

export const mapableCareCardClass =
  "rounded-2xl border border-slate-200 bg-[#F6FBFC]";

export const mapableCareEyebrowClass =
  "inline-flex w-fit rounded-full border border-[#005B7F]/20 bg-[#005B7F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#004766]";

export const mapableHeaderClass =
  "sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90";

export const mapablePageContainerClass = "container mx-auto px-4";

export const mapableSectionCardClass =
  "rounded-2xl border border-slate-200 bg-[#F6FBFC] shadow-sm";

export const mapableSearchInputClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-3 text-base text-[#0C1833] shadow-sm outline-none transition placeholder:text-slate-600 focus-visible:border-[#005B7F]/40 focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C] disabled:cursor-not-allowed disabled:opacity-60";

/** 1.4.8 visual presentation helpers for marketing lead/body copy. */
export const mapableTypography = {
  maxLineLengthCh: 80,
  lineHeight: 1.5,
  paragraphSpacingEm: 1.0,
  leadClass: "max-w-[80ch] text-lg leading-[1.5] text-[#334155] [&_p+p]:mt-[1em]",
  bodyClass: "max-w-[80ch] text-base leading-[1.5] text-[#334155] [&_p+p]:mt-[1em]",
} as const;
