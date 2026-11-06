import Link from "next/link";

export function SupportCloudSection() {
  return (
    <section
      aria-labelledby="support-cloud-heading"
      className="border-y border-slate-200 bg-[#F6FBFC]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Proposed platform
          </p>
          <h2
            id="support-cloud-heading"
            className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
          >
            MapAble Support Cloud
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700">
            A proposed white-label workspace for disability service organisations.
            Each organisation could present its own brand while MapAble provides
            the shared platform. This is not live hosting. Domain activation is
            not configured.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/for-providers"
              className="inline-flex min-h-11 items-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              For providers
            </Link>
            <Link
              href="/white-label"
              className="inline-flex min-h-11 items-center rounded-2xl border-2 border-[#0C1833] px-5 text-sm font-black text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              White-label solutions
            </Link>
          </div>
        </div>
        <figure className="rounded-3xl border border-slate-200 bg-white p-5">
          <svg
            role="img"
            aria-labelledby="workspace-diagram-title workspace-diagram-desc"
            viewBox="0 0 360 220"
            className="h-auto w-full"
          >
            <title id="workspace-diagram-title">
              Proposed branded provider workspaces
            </title>
            <desc id="workspace-diagram-desc">
              Three labelled workspace cards sit under one MapAble Support Cloud
              bar. The diagram is a proposal, not a live product.
            </desc>
            <rect x="16" y="16" width="328" height="40" rx="10" fill="#0C1833" />
            <text
              x="180"
              y="42"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="700"
            >
              MapAble Support Cloud — proposed
            </text>
            <rect x="16" y="80" width="100" height="110" rx="12" fill="#E8F4F8" stroke="#005B7F" />
            <text x="66" y="120" textAnchor="middle" fill="#0C1833" fontSize="12" fontWeight="700">
              Provider A
            </text>
            <text x="66" y="142" textAnchor="middle" fill="#005B7F" fontSize="11">
              Own brand
            </text>
            <rect x="130" y="80" width="100" height="110" rx="12" fill="#F3EEFF" stroke="#5B4B8A" />
            <text x="180" y="120" textAnchor="middle" fill="#0C1833" fontSize="12" fontWeight="700">
              Provider B
            </text>
            <text x="180" y="142" textAnchor="middle" fill="#5B4B8A" fontSize="11">
              Own brand
            </text>
            <rect x="244" y="80" width="100" height="110" rx="12" fill="#FFF4E5" stroke="#C2410C" />
            <text x="294" y="120" textAnchor="middle" fill="#0C1833" fontSize="12" fontWeight="700">
              Provider C
            </text>
            <text x="294" y="142" textAnchor="middle" fill="#C2410C" fontSize="11">
              Own brand
            </text>
          </svg>
          <figcaption className="mt-3 text-sm leading-6 text-slate-600">
            Each card is a proposed branded workspace. Text labels name the
            status. Colour is not the only way to tell them apart.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
