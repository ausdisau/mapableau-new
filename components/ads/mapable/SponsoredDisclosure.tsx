"use client";

type SponsoredDisclosureProps = {
  businessName?: string;
  className?: string;
};

/**
 * Visible + programmatic sponsored disclosure.
 * Label must be "Sponsored" — not Suggested/Featured/Recommended.
 */
export function SponsoredDisclosure({
  businessName,
  className,
}: SponsoredDisclosureProps) {
  const accessibleName = businessName
    ? `Sponsored listing: ${businessName}`
    : "Sponsored listing";

  return (
    <span
      className={
        className ??
        "inline-flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      }
      aria-label={accessibleName}
      data-ads-disclosure="sponsored"
    >
      Sponsored
    </span>
  );
}
