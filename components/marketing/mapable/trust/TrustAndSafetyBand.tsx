import { SectionEyebrow } from "../SectionEyebrow";
import { TrustMetricCard } from "../TrustMetricCard";

const TRUST_POINTS = [
  {
    value: "✓",
    label: "Verified profile badges only where verification data exists",
  },
  {
    value: "✓",
    label: "Funding options visible before enquiry",
  },
  {
    value: "✓",
    label: "Access-aware search filters",
  },
  {
    value: "✓",
    label: "Human support nearby when you need it",
  },
] as const;

export function TrustAndSafetyBand() {
  return (
    <section
      className="bg-mapable-navy py-14 text-white"
      aria-labelledby="trust-safety-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <SectionEyebrow className="text-mapable-yellow">Trust & safety</SectionEyebrow>
        <h2
          id="trust-safety-heading"
          className="mapable-display mt-2 text-2xl font-bold sm:text-3xl"
        >
          Choice, safety and access should travel together.
        </h2>
        <p className="mapable-soft mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
          MapAble helps you compare options with clear funding and access information. We do not
          replace your choice — you decide who to contact and what to share.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p) => (
            <TrustMetricCard
              key={p.label}
              value={p.value}
              label={p.label}
              className="border-white/10 bg-white/5 text-white [&_p:first-child]:text-mapable-yellow [&_p:last-child]:text-slate-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
