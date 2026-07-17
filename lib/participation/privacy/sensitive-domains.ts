import type {
  ParticipationDomainValue,
  ParticipationPrivacyLevelValue,
} from "@/lib/participation/types";

const SENSITIVE_DOMAINS: ReadonlySet<ParticipationDomainValue> = new Set([
  "faith",
  "advocacy",
  "civic",
  "peer_support",
]);

const SENSITIVE_KEYWORDS = [
  "sexuality",
  "lgbt",
  "lgbtq",
  "queer",
  "trans",
  "gender identity",
  "faith",
  "church",
  "mosque",
  "synagogue",
  "temple",
  "political",
  "advocacy",
  "rights",
  "peer support",
];

export function isSensitiveParticipationDomain(
  domain: ParticipationDomainValue | null | undefined,
): boolean {
  return Boolean(domain && SENSITIVE_DOMAINS.has(domain));
}

export function includesSensitiveParticipationKeyword(text: string): boolean {
  const normalised = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => normalised.includes(keyword));
}

export function defaultPrivacyForParticipation(params: {
  domain?: ParticipationDomainValue | null;
  text?: string | null;
}): ParticipationPrivacyLevelValue {
  if (isSensitiveParticipationDomain(params.domain)) return "private";
  if (params.text && includesSensitiveParticipationKeyword(params.text)) {
    return "private";
  }
  return "private";
}

export function assertNoParticipationScoreFields(fields: string[]) {
  const forbidden = [
    "loneliness",
    "engagement",
    "attendance",
    "social_isolation",
  ];
  const found = fields.find((field) =>
    forbidden.some((item) => field.toLowerCase().includes(item)),
  );
  if (found) {
    throw new Error(`PARTICIPATION_SCORE_FORBIDDEN:${found}`);
  }
}
