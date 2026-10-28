import type { AihwReportingUnit } from "@/lib/healthcare/aihw/contracts";

export type AihwHospitalMatch = {
  status: "MATCHED" | "REVIEW" | "NO_MATCH";
  score: number;
  hospital?: AihwReportingUnit;
  reason: string;
};

function norm(value: string) {
  return value.toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(the|hospital|public|health services?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");
}

export function matchAihwHospital(name: string, hospitals: AihwReportingUnit[]): AihwHospitalMatch {
  const target = norm(name);
  const ranked = hospitals.filter((h) => !h.closed).map((hospital) => {
    const names = [hospital.reporting_unit_name, ...(hospital.alternative_names ?? [])].map(norm);
    const exact = names.includes(target);
    const partial = names.some((n) => n.length >= 8 && target.length >= 8 && (n.includes(target) || target.includes(n)));
    return { hospital, score: exact ? 1 : partial ? 0.78 : 0 };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) return {
    status: "NO_MATCH",
    score: 0,
    reason: "No name-based AIHW hospital match. Do not link by coordinate proximity alone.",
  };

  const ambiguous = ranked[1] && best.score - ranked[1].score < 0.08;
  if (best.score === 1 && !ambiguous) return {
    status: "MATCHED",
    score: best.score,
    hospital: best.hospital,
    reason: "Exact canonical or alternative-name match.",
  };

  return {
    status: "REVIEW",
    score: best.score,
    hospital: best.hospital,
    reason: ambiguous ? "Multiple plausible matches require human review." : "Partial name match requires human review.",
  };
}
