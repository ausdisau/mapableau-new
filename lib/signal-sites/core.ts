/**
 * MapAble Signal Sites — conservative, deterministic accessibility evidence logic.
 * Local review is not independent verification or compliance certification.
 */

export const RATINGS = ["red", "amber", "green", "unknown"] as const;
export type SignalRating = (typeof RATINGS)[number];

export const EVIDENCE_STATES = [
  "reported",
  "reviewed",
  "outdated",
  "disputed",
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export type EvidenceObservation = {
  finding?: string;
  method?: string;
  observedAt?: string;
  measurement?: string;
  evidenceIds?: string[];
  evidenceState?: string;
  moderation?: string;
  proposed?: string;
  notApplicable?: boolean;
  claimBasis?: string;
  reviewBy?: string;
};

export type JourneyAggregate = {
  rating: SignalRating;
  reason: string;
};

export function hasEvidence(o: EvidenceObservation | null | undefined): boolean {
  if (!o) return false;
  const finding = String(o.finding || "").trim();
  const method = String(o.method || "").trim();
  const observedAt = String(o.observedAt || "").trim();
  const measurement = String(o.measurement || "").trim();
  return Boolean(
    finding.length >= 12 &&
      method &&
      observedAt &&
      (measurement ||
        (o.evidenceIds || []).length ||
        (method === "direct observation" && finding.length >= 24)),
  );
}

export function evidenceRating(
  o: EvidenceObservation | null | undefined,
): SignalRating {
  // Neither N/A nor assumptions can be Green.
  if (!o || o.notApplicable || o.claimBasis === "assumption") return "unknown";
  if (
    o.evidenceState !== "reviewed" ||
    o.moderation !== "accepted" ||
    !RATINGS.includes(o.proposed as SignalRating) ||
    !hasEvidence(o)
  ) {
    return "unknown";
  }
  if (o.reviewBy && o.reviewBy < new Date().toISOString().slice(0, 10)) {
    return "unknown";
  }
  return o.proposed as SignalRating;
}

export function aggregateJourney(
  segments: EvidenceObservation[] | null | undefined,
  options: {
    verifiedAlternative?: boolean;
    noVerifiedAlternative?: boolean;
  } = {},
): JourneyAggregate {
  const relevant = (segments || []).filter((s) => !s.notApplicable);
  if (!relevant.length) {
    return {
      rating: "unknown",
      reason: "No applicable journey segments are documented.",
    };
  }
  const ratings = relevant.map(evidenceRating);
  // Incomplete critical links cannot be treated as a confirmed green route.
  if (ratings.includes("unknown")) {
    return {
      rating: "unknown",
      reason:
        "One or more links have missing, unreviewed, disputed or outdated evidence.",
    };
  }
  if (ratings.includes("red")) {
    if (options.verifiedAlternative === true) {
      return {
        rating: "amber",
        reason:
          "An evidenced barrier exists, with a verified conditional alternative.",
      };
    }
    if (options.noVerifiedAlternative === true) {
      return {
        rating: "red",
        reason:
          "An evidenced critical route barrier has a documented check showing no verified usable alternative.",
      };
    }
    return {
      rating: "unknown",
      reason:
        "A critical barrier is documented, but possible alternatives have not been sufficiently checked.",
    };
  }
  if (ratings.includes("amber")) {
    return {
      rating: "amber",
      reason:
        "At least one link requires a condition, detour, assistance or adjustment.",
    };
  }
  return {
    rating: "green",
    reason:
      "All recorded applicable links were locally reviewed as green within their recorded scope and dates.",
  };
}

export function stripPrivate<T extends Record<string, unknown>>(o: T): Partial<T> {
  const c: Record<string, unknown> = { ...o };
  delete c.contact;
  delete c.participantName;
  delete c.privateNotes;
  delete c.evidenceIds;
  delete c.files;
  delete c.latitude;
  delete c.longitude;
  delete c.latitude2;
  delete c.longitude2;
  return c as Partial<T>;
}

export type RatingCounts = {
  red: number;
  amber: number;
  green: number;
  unknown: number;
  notApplicable: number;
};

export function countRatings(
  items: EvidenceObservation[] | null | undefined,
): RatingCounts {
  return (items || []).reduce<RatingCounts>(
    (acc, o) => {
      if (o.notApplicable) acc.notApplicable += 1;
      else acc[evidenceRating(o)] += 1;
      return acc;
    },
    { red: 0, amber: 0, green: 0, unknown: 0, notApplicable: 0 },
  );
}

export function csvCell(v: unknown): string {
  const s = String(v == null ? "" : v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function journeyStatus(
  segments: Array<
    EvidenceObservation & {
      requirement?: string;
      alternativeVerified?: boolean;
      noVerifiedAlternative?: boolean;
    }
  >,
): JourneyAggregate {
  const requirements = [
    ...new Set(
      segments
        .filter((o) => !o.notApplicable)
        .map((o) => String(o.requirement || "").trim()),
    ),
  ];
  if (requirements.length > 1) {
    return {
      rating: "unknown",
      reason:
        "These segments cover different functional requirements. Assess each route for one defined requirement; no universal score is calculated.",
    };
  }
  const reds = segments.filter((o) => evidenceRating(o) === "red");
  return aggregateJourney(segments, {
    verifiedAlternative:
      reds.length > 0 && reds.every((o) => o.alternativeVerified === true),
    noVerifiedAlternative:
      reds.length > 0 && reds.every((o) => o.noVerifiedAlternative === true),
  });
}
