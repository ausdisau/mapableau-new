/** Shared layout and typography for public module/info pages (aligned with combined homepage). */
export const mapablePublicPageContainerClass =
  "mx-auto w-full max-w-7xl px-5 lg:px-8";

export const mapablePublicEyebrowClass =
  "text-sm font-black uppercase tracking-[0.16em] text-mapable-brand";

export const mapablePublicTitleClass =
  "mapable-display text-3xl font-black leading-[1.15] tracking-[-0.04em] text-mapable-navy sm:text-5xl";

/** 1.4.8: ≤80ch, line-height ≥1.5, paragraph spacing via sibling margin. */
export const mapablePublicLeadClass =
  "mt-4 max-w-[80ch] text-base leading-[1.5] text-slate-600 sm:text-lg [&_p+p]:mt-[1em]";

export const mapablePublicSectionTitleClass =
  "text-sm font-black uppercase tracking-[0.16em] text-mapable-brand";

export const mapablePublicCardClass =
  "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm";

export const mapablePublicMutedCardClass =
  "rounded-[1.5rem] border border-slate-200 bg-mapable-surface p-5";

export const mapablePublicPrimaryButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl bg-mapable-brand px-6 text-sm font-black text-white shadow-sm transition hover:bg-mapable-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]";

export const mapablePublicSecondaryButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border-2 border-mapable-navy px-6 text-sm font-black text-mapable-navy transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005B7F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8C51C]";
