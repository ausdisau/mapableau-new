import Link from "next/link";

import { BrandWaveMark } from "@/components/coverage-care/BrandWaveMark";
import { COVERAGE_CARE_BRAND } from "@/lib/tenancy/coverage-care-brand";

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = `/t/${slug}`;

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-[color:var(--cc-olive)]/10"
        aria-labelledby="cc-hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #849F6340, transparent 50%), radial-gradient(ellipse at 80% 0%, #4B630C22, transparent 45%), linear-gradient(180deg, #F7F8F3 0%, #E7EEDC 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--cc-olive)]">
              {COVERAGE_CARE_BRAND.name}
            </p>
            <h1
              id="cc-hero-heading"
              className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-[color:var(--cc-olive)] sm:text-5xl"
            >
              {COVERAGE_CARE_BRAND.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--cc-ink)]/80">
              Explore proposed allied-health supports, choose how you want to
              communicate, create a synthetic enquiry, and keep decision
              authority — including withdrawal and deletion — with you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`${base}/services`}
                className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-5 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              >
                Explore services
              </Link>
              <Link
                href={`${base}/enquire`}
                className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-5 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              >
                Start an enquiry
              </Link>
            </div>
            <p className="mt-4 text-sm text-[color:var(--cc-ink)]/70">
              Prefer to speak with a person? See{" "}
              <Link href={`${base}/contact`} className="underline underline-offset-4">
                contact options
              </Link>
              . Voice calls are never mandatory.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end" aria-hidden>
            <div className="rounded-full bg-white/70 p-10 shadow-sm ring-1 ring-[color:var(--cc-sage)]/30">
              <BrandWaveMark className="h-24 w-72 text-[color:var(--cc-sage)]" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
        aria-labelledby="cc-values-heading"
      >
        <h2
          id="cc-values-heading"
          className="text-2xl font-semibold text-[color:var(--cc-olive)]"
        >
          Our values
        </h2>
        <p className="mt-2 max-w-2xl text-[color:var(--cc-ink)]/75">
          {COVERAGE_CARE_BRAND.mission}
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COVERAGE_CARE_BRAND.values.map((value) => (
            <li
              key={value}
              className="rounded-md border border-[color:var(--cc-sage)]/30 bg-white px-4 py-5 text-base font-medium text-[color:var(--cc-ink)]"
            >
              {value}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
