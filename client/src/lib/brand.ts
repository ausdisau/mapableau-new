/** Legacy Vite client — mirrors packages/ui MapAble palette (do not invent new colors). */
export const mapableBrand = {
  navy: "#0C1833",
  brandBlue: "#005B7F",
  brandBlueDark: "#004766",
  brandYellow: "#F8C51C",
  brandGreen: "#00A979",
  tagline: "Empowering Independence",
} as const;

export const mapableBrandAssets = {
  wordmark: "/brand/mapable-logo-wordmark.png",
  mark: "/brand/mapable-logo-mark.svg",
  wordmarkAlt: "MapAble — Empowering Independence",
} as const;

/** Auth / marketing hero gradients (Replit twin). */
export const mapableAuthHeroGradient = `linear-gradient(135deg, ${mapableBrand.navy} 0%, ${mapableBrand.brandBlueDark} 50%, ${mapableBrand.brandBlue} 100%)`;

export const mapableHeaderBarGradient = `linear-gradient(90deg, ${mapableBrand.brandBlueDark}, ${mapableBrand.brandBlue}, #00749E)`;