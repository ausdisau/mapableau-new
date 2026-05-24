import { SponsoredCard } from "./SponsoredCard";
import { SectionEyebrow } from "./SectionEyebrow";

export type SponsoredPartner = {
  id: string;
  title: string;
  description: string;
  label?: "Sponsored partner" | "Community partner" | "Featured provider";
  href?: string;
};

export function SponsoredPartnerStrip({
  partners,
  heading = "Community partners",
}: {
  partners: SponsoredPartner[];
  heading?: string;
}) {
  if (partners.length === 0) return null;

  return (
    <section
      className="border-y border-mapable-yellow/30 bg-mapable-yellow/5 py-12"
      aria-labelledby="sponsored-partners-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <h2 id="sponsored-partners-heading" className="sr-only">
          {heading}
        </h2>
        <SectionEyebrow>{heading}</SectionEyebrow>
        <p className="mapable-soft mt-2 max-w-2xl text-sm text-slate-600">
          Paid or partner placements are labelled separately from organic search results and
          verified recommendations.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {partners.map((p) => (
            <li key={p.id}>
              <SponsoredCard
                title={p.title}
                description={p.description}
                label={p.label ?? "Community partner"}
                href={p.href}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
