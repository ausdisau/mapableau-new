/** Canonical palette from the combined-care homepage — single source of truth. */
export const mapableCareColors = {
  navy: "#0C1833",
  brandBlue: "#005B7F",
  brandBlueDark: "#004766",
  brandYellow: "#F8C51C",
  brandGreen: "#00A979",
  surface: "#F6FBFC",
  white: "#FFFFFF",
} as const;

/**
 * Canonical keyboard focus recipe (Tailwind).
 * Pairs with `.mapable-focus` in `app/index.css` for forced-colours support.
 * Uses :focus-visible — a dark navy outer ring plus light separation.
 */
export const mapableCareFocusRing =
  "mapable-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1833] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** Softer focus for dense controls; still meets two-colour visibility. */
export const mapableCareFocusRingSubtle =
  "mapable-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const mapableCareBodyClass = "text-[var(--mapable-navy-hex,#0C1833)]";

export const mapableCarePageBgClass = "bg-white";

export const mapableCareCtaClass =
  `rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] ${mapableCareFocusRing}`;

export const mapableCareOutlineCtaClass =
  `rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`;

export const mapableCareCardClass =
  "rounded-2xl border border-slate-200 bg-[#F6FBFC]";

export const mapableCareEyebrowClass =
  "inline-flex w-fit rounded-full border border-[#005B7F]/20 bg-[#005B7F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]";
