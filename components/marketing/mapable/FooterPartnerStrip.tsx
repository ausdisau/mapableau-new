import { SAMPLE_SPONSORED_PARTNERS } from "@/lib/provider-finder/mock-data";

import { SponsoredBadge } from "./SponsoredBadge";

export function FooterPartnerStrip() {
  if (SAMPLE_SPONSORED_PARTNERS.length === 0) return null;

  return (
    <section
      className="mx-auto mt-12 max-w-6xl rounded-xl border border-dashed border-slate-300 bg-white p-6"
      aria-labelledby="footer-partners-heading"
    >
      <h2
        id="footer-partners-heading"
        className="mapable-display flex flex-wrap items-center gap-2 text-sm font-semibold text-mapable-navy"
      >
        Community partners
        <SponsoredBadge label="Community partner" />
      </h2>
      <ul className="mt-4 space-y-3" role="list">
        {SAMPLE_SPONSORED_PARTNERS.map((p) => (
          <li key={p.id} className="mapable-soft text-sm text-slate-600">
            <span className="font-medium text-mapable-navy">{p.title}</span>
            {" — "}
            {p.description}
          </li>
        ))}
      </ul>
    </section>
  );
}
