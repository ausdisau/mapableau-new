/** Canonical MapAble marketing palette — 2026 identity. */
export const mapableCareColors = {
  blue700: "#1E5A8A",
  blue800: "#174A73",
  blue900: "#103A5D",
  violet600: "#72549D",
  orange500: "#F47A2A",
  gold400: "#F1B51C",
  navy950: "#10233A",
  slate700: "#435466",
  slate500: "#66788A",
  surface: "#F7FAFC",
  surfaceBlue: "#F1F7FB",
  white: "#FFFFFF",
  border: "#DDE7EE",
  /** WCAG AA warm tagline on white — gold itself is decorative only. */
  tagline: "#9A4A12",
  brandBlue: "#1E5A8A",
  brandBlueDark: "#174A73",
  brandYellow: "#F1B51C",
  brandGreen: "#00A979",
  navy: "#10233A",
} as const;

/**
 * WCAG 2.2 focus appearance: ≥2px ring + offset, high-contrast primary.
 * Prefer focus-visible so mouse users are not interrupted.
 */
export const mapableInteractiveFocusRing =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

/** Brand-forward focus for marketing CTAs. */
export const mapableCareFocusRing =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

export const mapableCareFocusRingSubtle =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary/80";

export const mapableCareBodyClass = "mapable-soft text-mapable-text";

export const mapableCarePageBgClass = "bg-white";

export const mapableCareCtaClass =
  "inline-flex min-h-12 items-center justify-center rounded-2xl bg-mapable-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-mapable-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

export const mapableCareOutlineCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-mapable-primary bg-white px-5 py-3 text-sm font-black text-mapable-primary transition hover:bg-mapable-surface-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

export const mapableCareWarmCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl bg-mapable-gold px-5 py-3 text-sm font-black text-mapable-navy shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

export const mapableCareGhostCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-2xl bg-transparent px-5 py-3 text-sm font-black text-mapable-primary transition hover:bg-mapable-surface-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-mapable-primary";

export const mapableCareCardClass =
  "rounded-[1.5rem] border border-mapable-border bg-white p-6 shadow-sm sm:p-8";

export const mapableCareEyebrowClass =
  "inline-flex w-fit rounded-full border border-mapable-primary/20 bg-mapable-surface-blue px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-mapable-primary";
