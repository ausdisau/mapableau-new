export function SponsoredBadge({
  label,
}: {
  label:
    | "Sponsored partner"
    | "Sponsored result"
    | "Community partner"
    | "Featured provider";
}) {
  return (
    <span className="inline-flex rounded-full border border-mapable-navy/15 bg-white px-2.5 py-1 text-xs font-semibold text-mapable-navy">
      {label}
    </span>
  );
}
