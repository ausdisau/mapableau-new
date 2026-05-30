/** Shared Tailwind class groups aligned with mapable.com.au */
export const mapableHeaderClass =
  "sticky top-0 z-50 border-b border-border/60 bg-card/85 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/70";

export const mapableNavLinkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const mapableNavLinkActiveClass =
  "rounded-lg px-3 py-2 text-sm font-medium bg-primary/10 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const mapablePageContainerClass = "container mx-auto px-4";

/** Sub-app module layouts (Care, Transport, Marketplace). */
export const mapableModuleMainClass = "mx-auto max-w-6xl px-4 py-8";

export const mapableModuleNavLinkClass =
  "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const mapableModuleNavLinkActiveClass =
  "inline-flex min-h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const mapableModuleBackLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md";

export const mapableSectionHeadingClass = "font-heading text-xl font-semibold";

export const mapableHubPageStackClass = "space-y-8";

export const mapableSectionCardClass =
  "rounded-xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-md";

export const mapableEyebrowBadgeClass =
  "border-primary/30 bg-primary/10 font-semibold text-primary shadow-sm";

export const mapableEyebrowBadgeSecondaryClass =
  "border-secondary/20 bg-secondary/5 text-secondary";

/** Accessible search inputs — stronger placeholder contrast than default muted. */
export const mapableSearchInputClass =
  "min-h-12 w-full rounded-xl border border-input bg-background py-3 pr-3 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export const mapableSearchFieldSecondaryClass =
  "rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 sm:p-4";
