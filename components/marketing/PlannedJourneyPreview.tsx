import type { PublicRoadmapModule } from "@/lib/marketing/coming-soon-journeys";
import { PUBLIC_PLANNED_JOURNEYS } from "@/lib/marketing/coming-soon-journeys";

/**
 * Accessible, read-only concept walkthrough. Never imply that an enquiry,
 * booking, clinician or payment integration is operational.
 */
export function PlannedJourneyPreview({ module }: { module: PublicRoadmapModule }) {
  const journey = PUBLIC_PLANNED_JOURNEYS[module];

  return (
    <section
      aria-labelledby={"planned-journey-" + module}
      className="mt-8 rounded-[1.5rem] border border-slate-300 bg-white p-5 sm:p-7"
    >
      <p className="text-sm font-bold text-slate-700">
        Design preview - not a bookable or live service
      </p>
      <h2
        id={"planned-journey-" + module}
        className="mt-2 text-xl font-black tracking-tight text-[#0C1833]"
      >
        How this could work: {journey.title}
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-700">{journey.outcome}</p>
      <details className="mt-5 rounded-xl border border-slate-300 p-4">
        <summary className="cursor-pointer font-semibold text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005B7F]">
          Explore the proposed steps, safeguards and alternatives
        </summary>
        <ol className="mt-5 list-decimal space-y-3 pl-6 text-slate-700">
          {journey.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <h3 className="mt-6 font-bold text-[#0C1833]">Before a pilot can open</h3>
        <p className="mt-2 leading-7 text-slate-700">{journey.releaseGate}</p>
        <h3 className="mt-5 font-bold text-[#0C1833]">If something goes wrong</h3>
        <p className="mt-2 leading-7 text-slate-700">{journey.recovery}</p>
      </details>
    </section>
  );
}
