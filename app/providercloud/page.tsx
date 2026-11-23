import Link from "next/link";

import { buildProviderCloudStatus } from "@/lib/providercloud/status";

export default function ProviderCloudHomePage() {
  const status = buildProviderCloudStatus();

  return (
    <>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(248,197,28,0.16),_transparent_38%),linear-gradient(145deg,#071727,#0B2C3E)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#F8C51C]">
              MapAbleID service · providercloud
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              ProviderCloud
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75 sm:text-xl">
              A hosted operations surface for support providers on{" "}
              <span className="font-semibold text-white">{status.host}</span>.
              It answers what needs human attention, then deep-links into Care,
              Transport, Billing, Workforce, and Continuity. It does not create
              operational records.
            </p>
          </div>
          <aside className="self-end rounded-3xl border border-[#F8C51C]/30 bg-[#F8C51C]/10 p-6">
            <p className="font-black text-[#F8C51C]">Operating boundary</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-white/80">
              <li>Supplier operations are disabled and cannot be turned on here.</li>
              <li>Not a premium listing, pay-to-rank, or commercial SKU.</li>
              <li>
                Provider Operations attention stays flagged off until a separate
                enablement decision (`MAPABLE_PROVIDER_OPS_ENABLED`).
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight">Honest status</h2>
          <p className="mt-3 leading-7 text-white/70">
            Identity lists ProviderCloud as connected because this hosted
            surface exists. That is not a claim that live supplier sync,
            ranking, or attention automation is on.
          </p>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Identity", status.identityStatus],
            ["Surface", status.surface.replaceAll("_", " ")],
            [
              "Provider ops flag",
              status.operations.providerOpsEnabled ? "enabled" : "disabled",
            ],
            [
              "Supplier operations",
              status.operations.supplierOperationsEnabled
                ? "enabled"
                : "disabled",
            ],
            [
              "Premium placement",
              status.operations.premiumPlacement ? "on" : "off",
            ],
            ["Paid ranking", status.operations.paidRanking ? "on" : "off"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-5"
            >
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-white/55">
                {label}
              </dt>
              <dd className="mt-2 text-xl font-black capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-white/10 bg-white/[0.025]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight">Canonical writers</h2>
          <p className="mt-3 max-w-3xl leading-7 text-white/70">
            Resolve work in the existing provider console. ProviderCloud does
            not add a second writer.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {status.writers.map((writer) => (
              <article
                key={writer.id}
                className="flex min-h-48 flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6"
              >
                <h3 className="text-2xl font-black tracking-tight">
                  {writer.title}
                </h3>
                <p className="mt-3 flex-1 leading-7 text-white/70">
                  {writer.purpose}
                </p>
                <Link
                  href={writer.href}
                  className="mt-6 inline-flex w-fit rounded-xl bg-[#F8C51C] px-5 py-3 font-black text-[#071727] transition hover:bg-[#FFD94F] focus:outline-none focus:ring-4 focus:ring-white/40"
                >
                  Open {writer.title}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
