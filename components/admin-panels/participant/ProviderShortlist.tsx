import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
export function ProviderShortlist({
  consented,
  suggested,
}: {
  consented: { id: string; name: string; serviceRegions: string[] }[];
  suggested: { id: string; name: string; serviceRegions: string[] }[];
}) {
  return (
    <PanelSection title="Provider shortlist">
      <h3 className="text-sm font-semibold">Consented providers</h3>
      <ProviderList items={consented} empty="No consented providers yet." />
      <h3 className="mt-6 text-sm font-semibold">Verified providers near you</h3>
      <ProviderList items={suggested} empty="No suggestions available." />
      <Link
        href="/provider-finder"
        className="mt-4 inline-flex min-h-10 text-sm font-medium text-primary hover:underline"
      >
        Search provider map →
      </Link>
    </PanelSection>
  );
}

function ProviderList({
  items,
  empty,
}: {
  items: { id: string; name: string; serviceRegions: string[] }[];
  empty: string;
}) {
  if (!items.length) return <p className="mt-2 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((o) => (
        <li key={o.id} className="rounded-lg border border-border px-3 py-2 text-sm">
          <span className="font-medium">{o.name}</span>
          {o.serviceRegions?.length ? (
            <span className="text-muted-foreground">
              {" "}
              · {o.serviceRegions.join(", ")}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
