import type { ConsentDirective } from "@prisma/client";

/**
 * MapAble ConsentDirective -> FHIR Consent (R4) mapper.
 *
 * The FHIR Consent resource is used for structured interoperability. The
 * mapping is intentionally conservative — we only emit fields that we can
 * back with a directive. Signature material is deliberately omitted; MapAble
 * does not currently claim to sign FHIR resources.
 */

export interface FhirConsent {
  resourceType: "Consent";
  status: "active" | "inactive" | "entered-in-error";
  scope: { coding: [{ system: string; code: string; display: string }] };
  category: Array<{
    coding: [{ system: string; code: string; display: string }];
  }>;
  patient: { identifier: { system: string; value: string } };
  dateTime: string;
  performer?: Array<{ identifier: { system: string; value: string } }>;
  provision?: {
    type: "permit" | "deny";
    period?: { start?: string; end?: string };
    purpose?: Array<{ system: string; code: string; display: string }>;
  };
  meta: {
    source: "https://mapable.com.au/directive";
    tag: Array<{ system: string; code: string }>;
  };
}

export function toFhirConsent(directive: ConsentDirective): FhirConsent {
  const status =
    directive.status === "active" && directive.decision === "active"
      ? "active"
      : "inactive";
  return {
    resourceType: "Consent",
    status,
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "https://mapable.com.au/consent-category",
            code: directive.purpose,
            display: directive.purposeDetail,
          },
        ],
      },
    ],
    patient: {
      identifier: {
        system: "https://mapable.com.au/pairwise",
        value: `pairwise:${directive.subjectId}`,
      },
    },
    dateTime: directive.effectiveFrom.toISOString(),
    provision: {
      type: directive.decision === "active" ? "permit" : "deny",
      period: {
        start: directive.effectiveFrom.toISOString(),
        end: directive.effectiveUntil?.toISOString(),
      },
      purpose: [
        {
          system: "https://mapable.com.au/consent-purpose",
          code: directive.purpose,
          display: directive.purpose,
        },
      ],
    },
    meta: {
      source: "https://mapable.com.au/directive",
      tag: [
        {
          system: "https://mapable.com.au/tags",
          code: "wave9-directive",
        },
      ],
    },
  };
}
