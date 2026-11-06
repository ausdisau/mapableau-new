import { COVERAGE_CARE_BRAND } from "@/lib/tenancy/coverage-care-brand";

export default async function TenantAboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        About {COVERAGE_CARE_BRAND.name}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[color:var(--cc-ink)]/85">
        {COVERAGE_CARE_BRAND.mission}
      </p>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--cc-ink)]/80">
        Brand line: <em>{COVERAGE_CARE_BRAND.tagline}</em>
      </p>
      <dl className="mt-8 space-y-3 rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-5 text-base">
        <div>
          <dt className="font-medium">Proposed provider identity</dt>
          <dd>
            {COVERAGE_CARE_BRAND.name} — ABN {COVERAGE_CARE_BRAND.abn} (as
            supplied by the project owner). NDIS registration, practitioner
            credentials and live operating capacity are{" "}
            <strong>not verified</strong> in this synthetic preview.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Platform relationship</dt>
          <dd>
            MapAble is the SaaS / facilitator. Coverage Care is an independent
            proposed provider tenant. {COVERAGE_CARE_BRAND.poweredBy}.
          </dd>
        </div>
      </dl>
      <h2 className="mt-10 text-xl font-semibold text-[color:var(--cc-olive)]">
        Guiding values
      </h2>
      <ul className="mt-4 list-disc space-y-1 pl-5">
        {COVERAGE_CARE_BRAND.values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
