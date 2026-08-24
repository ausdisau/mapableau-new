import type { ConstraintFailure, HardConstraint, HardConstraintKind, OptionCandidate, OptionsDomain } from "./types";

function includesIgnoreCase(haystacks: string[], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return haystacks.some((h) => h.toLowerCase().includes(n));
}

function isExcluded(candidate: OptionCandidate, exclusions: string[]): boolean {
  if (exclusions.length === 0) return false;
  const idLower = candidate.id.toLowerCase();
  const nameLower = candidate.displayName.toLowerCase();
  const providerLower = candidate.providerLabel.toLowerCase();
  return exclusions.some((raw) => {
    const ex = raw.trim().toLowerCase();
    if (!ex) return false;
    return idLower === ex || nameLower === ex || nameLower.includes(ex) || providerLower === ex || candidate.exclusions.some((c) => c.toLowerCase() === ex);
  });
}

function fail(candidateId: string, kind: HardConstraintKind, reason: string): ConstraintFailure {
  return { candidateId, kind, reason };
}

export function applyHardConstraints(input: {
  domain: OptionsDomain; candidates: OptionCandidate[]; requirements: HardConstraint[];
  exclusions?: string[]; disclosureConsentGranted?: boolean;
}): { eligible: OptionCandidate[]; eliminated: ConstraintFailure[] } {
  const eliminated: ConstraintFailure[] = [];
  const eligible: OptionCandidate[] = [];
  const exclusionList = [
    ...(input.exclusions ?? []),
    ...input.requirements.filter((r) => r.kind === "participant_exclusion").map((r) => r.value),
  ];
  for (const candidate of input.candidates) {
    if (candidate.domain !== input.domain) {
      eliminated.push(fail(candidate.id, "location_service_area", `Candidate domain ${candidate.domain} does not match request domain ${input.domain}.`));
      continue;
    }
    if (isExcluded(candidate, exclusionList)) {
      eliminated.push(fail(candidate.id, "participant_exclusion", "Candidate is on the participant exclusion list."));
      continue;
    }
    let rejected = false;
    for (const req of input.requirements) {
      if (!req.required) continue;
      const result = evaluateConstraint(candidate, req, { disclosureConsentGranted: input.disclosureConsentGranted === true, domain: input.domain });
      if (!result.ok) { eliminated.push(fail(candidate.id, req.kind, result.reason)); rejected = true; break; }
    }
    if (rejected) continue;
    const domainFail = domainHardGate(candidate, input);
    if (domainFail) { eliminated.push(domainFail); continue; }
    eligible.push(candidate);
  }
  return { eligible, eliminated };
}

function evaluateConstraint(candidate: OptionCandidate, req: HardConstraint, ctx: { disclosureConsentGranted: boolean; domain: OptionsDomain }): { ok: true } | { ok: false; reason: string } {
  switch (req.kind) {
    case "required_accessibility_feature": {
      const ok = includesIgnoreCase([...candidate.features, ...candidate.preferenceTags], req.value);
      if (!ok && candidate.vehicleSuitability?.wheelchairAccessible && /wheelchair/i.test(req.value)) {
        return candidate.vehicleSuitability.verified ? { ok: true } : { ok: false, reason: "Wheelchair accessibility is claimed but not verified — hard constraint not met." };
      }
      return ok ? { ok: true } : { ok: false, reason: `Missing required accessibility feature: ${req.value}.` };
    }
    case "verified_vehicle_suitability": {
      if (!candidate.vehicleSuitability) return { ok: false, reason: "No vehicle suitability evidence for this candidate." };
      if (!candidate.vehicleSuitability.verified) return { ok: false, reason: "Vehicle suitability is not verified." };
      if (/wheelchair/i.test(req.value) && !candidate.vehicleSuitability.wheelchairAccessible) return { ok: false, reason: "Vehicle is not wheelchair accessible." };
      if (/hoist/i.test(req.value) && !candidate.vehicleSuitability.hoistAvailable) return { ok: false, reason: "Vehicle hoist is not available." };
      return { ok: true };
    }
    case "required_worker_credential": {
      return includesIgnoreCase(candidate.credentials, req.value) ? { ok: true } : { ok: false, reason: `Missing required credential: ${req.value}. Credential ≠ competence.` };
    }
    case "availability_window": {
      return includesIgnoreCase(candidate.availabilityWindows, req.value) ? { ok: true } : { ok: false, reason: `Candidate is not available in window: ${req.value}.` };
    }
    case "location_service_area": {
      return includesIgnoreCase(candidate.serviceAreas, req.value) ? { ok: true } : { ok: false, reason: `Outside service area / location: ${req.value}.` };
    }
    case "participant_exclusion": {
      return isExcluded(candidate, [req.value]) ? { ok: false, reason: "Participant exclusion matched." } : { ok: true };
    }
    case "employer_work_requirement": {
      if (ctx.domain !== "jobs") return { ok: true };
      const ok = includesIgnoreCase([...candidate.features, ...candidate.preferenceTags, ...candidate.credentials], req.value);
      return ok ? { ok: true } : { ok: false, reason: `Does not meet authorised work requirement: ${req.value}.` };
    }
    case "consent_disclosure_boundary": {
      void candidate; void ctx; void req; return { ok: true };
    }
    default: {
      const _exhaustive: never = req.kind; void _exhaustive;
      return { ok: false, reason: "Unknown hard constraint kind." };
    }
  }
}

function domainHardGate(candidate: OptionCandidate, input: { domain: OptionsDomain; disclosureConsentGranted?: boolean }): ConstraintFailure | null {
  if (input.domain === "transport" && candidate.vehicleSuitability) {
    const needsWheelchair = candidate.features.some((f) => /wheelchair/i.test(f));
    if (needsWheelchair && candidate.vehicleSuitability.wheelchairAccessible && !candidate.vehicleSuitability.verified) {
      return fail(candidate.id, "verified_vehicle_suitability", "Wheelchair-accessible claim without verification — eliminated.");
    }
  }
  void input.disclosureConsentGranted;
  return null;
}

export function mapLegacyConstraintKind(legacy: string): HardConstraintKind | null {
  const key = legacy.trim().toLowerCase();
  const map: Record<string, HardConstraintKind> = {
    accessibility: "required_accessibility_feature", accessibilityrequirements: "required_accessibility_feature",
    required_accessibility_feature: "required_accessibility_feature", credential: "required_worker_credential",
    credentialrequirements: "required_worker_credential", required_worker_credential: "required_worker_credential",
    exclusion: "participant_exclusion", exclusions: "participant_exclusion", participant_exclusion: "participant_exclusion",
    geography: "location_service_area", location: "location_service_area", service_area: "location_service_area",
    location_service_area: "location_service_area", availability: "availability_window", availability_window: "availability_window",
    vehicle: "verified_vehicle_suitability", verified_vehicle_suitability: "verified_vehicle_suitability",
    disclosure: "consent_disclosure_boundary", consent_disclosure_boundary: "consent_disclosure_boundary",
    employer: "employer_work_requirement", employer_work_requirement: "employer_work_requirement",
  };
  return map[key] ?? null;
}
