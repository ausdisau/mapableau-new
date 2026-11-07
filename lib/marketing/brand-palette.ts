/**
 * Marketing-only MapAble palette derived from the mountain + accessibility lockup.
 * App/dashboard surfaces keep @mapable/ui tokens (teal/gold) until a shared
 * migration is approved.
 *
 * UX rhythm is informed by peer disability peak-body patterns (e.g. PDA):
 * pill CTAs, dual primary/ghost actions, calm section breathing room —
 * colours stay MapAble navy/orange/royal/violet.
 *
 * Contrast: navy on white/surface; white or navy on orange CTAs (large bold text);
 * orange focus rings on light backgrounds.
 */
export const marketingColors = {
  navy: "#0C1833",
  orange: "#F26A21",
  orangeDark: "#D45512",
  royalBlue: "#3B5BDB",
  violet: "#8B4DFF",
  surface: "#F7F8FC",
  white: "#FFFFFF",
} as const;

export type MarketingColor = (typeof marketingColors)[keyof typeof marketingColors];

/** Orange primary CTA with navy text (WCAG-safer fill for compact labels). */
export const marketingPrimaryCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[#F26A21] px-6 text-sm font-black text-[#0C1833] transition hover:bg-[#D45512] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F26A21]";

/** Navy outline secondary CTA. */
export const marketingOutlineCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#0C1833] bg-white px-6 text-sm font-black text-[#0C1833] transition hover:bg-[#F7F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F26A21]";

/** White solid CTA for dark hero bands (PDA-style primary on photo overlays). */
export const marketingOnDarkSolidCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-[#0C1833] transition hover:bg-[#F7F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F26A21]";

/** White outline CTA for navy / photo-overlay bands. */
export const marketingGhostCtaClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-6 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F26A21]";

export const marketingFocusRingClass =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F26A21]";

export const marketingEyebrowClass =
  "inline-flex w-fit rounded-full border border-[#3B5BDB]/25 bg-[#3B5BDB]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#3B5BDB]";

export const marketingPageBgClass = "bg-[#F7F8FC]";

export const marketingBrandGradient =
  "linear-gradient(135deg, #3B5BDB 0%, #8B4DFF 50%, #F26A21 100%)";
