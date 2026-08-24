import Link from "next/link";

import { ExperimentShell } from "@/components/labs/ExperimentShell";
import {
  buildLabsNativeIntelligenceView,
  labsPortfolioBlurb,
  summarisePortfolio,
} from "@/lib/ai/platform/native-intelligence";
import { isNativeIntelligenceRndEnabled } from "@/lib/config/native-intelligence";

export function NativeIntelligenceLabExperiment() {
  const enabled = isNativeIntelligenceRndEnabled();
  const view = buildLabsNativeIntelligenceView({ decision: null });
  const portfolio = summarisePortfolio();

  return (
    <ExperimentShell
      title="MapAble-native intelligence"
      summary="Experimental exploration of a MapAble-owned model portfolio, local/open-weight routes, and governed retrieval — without replacing the production AI gateway or expanding authority."
      status="PRODUCT_RESEARCH"
    >
      <div className="space-y-8">
        <section
          className="rounded-3xl border border-white/10 bg-white/[0.045] p-6"
          aria-labelledby="status-heading"
        >
          <h2 id="status-heading" className="text-xl font-black">
            Experiment status
          </h2>
          <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-[#F8C51C]">
            {view.label}
          </p>
          <p className="mt-3 leading-7 text-white/75" role="status">
            {enabled
              ? "R&D flag is on in this environment. Routes remain Labs-only and cannot execute actions."
              : "R&D flag is off (fail-closed). Set MAPABLE_NATIVE_INTELLIGENCE_RND_ENABLED=true in a non-production environment to exercise the router."}
          </p>
          <p className="mt-2 text-sm text-white/60">{labsPortfolioBlurb()}</p>
          <p className="mt-2 text-sm text-white/60">
            Production supported: {String(view.productionSupported)} · Participant
            claims allowed: {String(view.participantFacingClaimAllowed)}
          </p>
        </section>

        <section aria-labelledby="limits-heading" className="space-y-3">
          <h2 id="limits-heading" className="text-xl font-black">
            Limitations
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-white/75">
            {view.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="data-heading" className="space-y-3">
          <h2 id="data-heading" className="text-xl font-black">
            Data handling
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-7 text-white/75">
            {view.dataHandling.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="portfolio-heading" className="space-y-3">
          <h2 id="portfolio-heading" className="text-xl font-black">
            Portfolio snapshot
          </h2>
          <p className="leading-7 text-white/75">
            {portfolio.totalModels} registered portfolio models ·{" "}
            {portfolio.rndOnlyCount} R&D-only ·{" "}
            {portfolio.productionEligibleCount} with pilot/production eval status.
            Promotion is never automatic.
          </p>
        </section>

        <p className="text-sm text-white/55">
          Model used in this view: {view.modelUsed ?? "none (informational surface)"}.{" "}
          <Link
            href="/labs"
            className="font-bold text-[#F8C51C] underline decoration-[#F8C51C]/30 underline-offset-4"
          >
            Back to Labs
          </Link>
        </p>
      </div>
    </ExperimentShell>
  );
}
