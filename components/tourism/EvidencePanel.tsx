import { Accessibility, CheckCircle2, ExternalLink } from "lucide-react";

import { EvidenceBadge } from "@/components/tourism/EvidenceBadge";
import type { AccessEvidence, TourismPlace } from "@/lib/tourism/types";

function EvidenceBlock({
  title,
  evidence,
  icon,
}: {
  title: string;
  evidence: AccessEvidence;
  icon: "step" | "toilet";
}) {
  const Icon = icon === "step" ? Accessibility : CheckCircle2;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Icon size={20} aria-hidden />
        <h3 className="font-bold">{title}</h3>
        <EvidenceBadge status={evidence.status} />
      </div>
      <p className="text-slate-700">{evidence.summary}</p>
      {evidence.limitations.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {evidence.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-slate-600">
        {evidence.sourceName} · checked {evidence.checkedOn}
      </p>
    </div>
  );
}

export function EvidencePanel({ place }: { place: TourismPlace }) {
  return (
    <section className="space-y-5 rounded-3xl border bg-white p-6" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className="text-2xl font-black">
        Accessibility evidence
      </h2>
      <EvidenceBlock title="Step-free access" evidence={place.features.stepFree} icon="step" />
      <EvidenceBlock title="Accessible toilets" evidence={place.features.toilets} icon="toilet" />
      {place.features.extras.map((extra) => (
        <EvidenceBlock key={extra.summary} title="Additional access note" evidence={extra} icon="toilet" />
      ))}
      <div className="rounded-xl bg-amber-50 p-4">
        <h3 className="font-bold text-amber-950">Access caveat</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-950">
          {place.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </div>
      <div className="text-sm text-slate-600">
        <p>
          {place.sourceType === "opentripmap"
            ? "Source: OpenTripMap point-of-interest record. No step-free or accessible-toilet evidence is available from this listing."
            : "Evidence type: published operator or tourism listing; not an independent MapAble inspection. None of these Sydney demo places are independently verified."}
        </p>
        <a
          className="mt-2 inline-flex items-center gap-1 font-bold text-[#005B7F] underline"
          href={place.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {place.sourceType === "opentripmap"
            ? "OpenTripMap source and licence"
            : `Read source: ${place.sourceName}`}
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </section>
  );
}
