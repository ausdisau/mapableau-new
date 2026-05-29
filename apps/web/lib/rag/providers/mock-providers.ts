import {
  isMockParticipant,
  MOCK_CONSENT,
  MOCK_GOALS,
  MOCK_MISSING_EVIDENCE,
  MOCK_OPEN_RISKS,
  MOCK_PLAN,
  MOCK_PROFILE,
  MOCK_UPCOMING_EVENTS,
} from "@/lib/prms/mockPrmsData";

import { scoreText } from "../scoring";
import type { ModuleId, ModuleRagContext, ModuleRagProvider, RagChunk } from "../types";
import { requiredScopesForModule } from "../consent-for-module";

function chunk(
  moduleId: ModuleId,
  source: string,
  text: string,
  score: number
): RagChunk {
  return {
    id: `${moduleId}:${source}`,
    moduleId,
    source,
    text,
    score,
  };
}

function rank(
  ctx: ModuleRagContext,
  moduleId: ModuleId,
  candidates: { source: string; text: string }[]
): RagChunk[] {
  return candidates
    .map((c) => ({
      ...c,
      score: scoreText(ctx.query, c.text),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((c) => chunk(moduleId, c.source, c.text, c.score));
}

const prmsProvider: ModuleRagProvider = {
  moduleId: "prms",
  requiredScopes: requiredScopesForModule("prms"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "prms", [
      {
        source: "plan_summary",
        text: `NDIS plan ${MOCK_PLAN.status}, funding ${MOCK_PLAN.fundingManagement}, budget band ${MOCK_PLAN.overallBudgetBand}.`,
      },
      {
        source: "profile_completion",
        text: `Profile ${MOCK_PROFILE.profileCompletionPercent}% complete; preferred name ${MOCK_PROFILE.preferredName}.`,
      },
      {
        source: "active_goals",
        text: MOCK_GOALS.map((g) => `${g.domain}: ${g.summary}`).join(" "),
      },
    ]);
  },
};

const consentProvider: ModuleRagProvider = {
  moduleId: "consent",
  requiredScopes: [],
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    const granted = MOCK_CONSENT.records
      .filter((r) => r.status === "granted")
      .map((r) => r.scope);
    return rank(ctx, "consent", [
      {
        source: "granted_scopes",
        text: `Consent granted for: ${granted.join(", ")}.`,
      },
      {
        source: "sharing_rules",
        text: "Transport and care providers only receive accessibility notes you approve per booking.",
      },
    ]);
  },
};

const careProvider: ModuleRagProvider = {
  moduleId: "care",
  requiredScopes: requiredScopesForModule("care"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    const access = MOCK_PROFILE.accessNeeds.map((a) => a.label).join(", ");
    return rank(ctx, "care", [
      {
        source: "access_needs",
        text: `Care access needs: ${access}.`,
      },
      {
        source: "support_logs",
        text:
          MOCK_MISSING_EVIDENCE.length > 0
            ? `Missing signed support logs: ${MOCK_MISSING_EVIDENCE.join("; ")}.`
            : "Support logs are up to date for recent services.",
      },
      {
        source: "upcoming_care",
        text: MOCK_UPCOMING_EVENTS.filter((e) =>
          e.type.includes("care")
        )
          .map((e) => `${e.title} (${e.status})`)
          .join(" ") || "No upcoming care events in the demo record.",
      },
    ]);
  },
};

const transportProvider: ModuleRagProvider = {
  moduleId: "transport",
  requiredScopes: requiredScopesForModule("transport"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    const aids = MOCK_PROFILE.mobilityAids.map((m) => m.label).join(", ");
    return rank(ctx, "transport", [
      {
        source: "mobility_aids",
        text: `Transport mobility aids: ${aids}.`,
      },
      {
        source: "wheelchair_transport",
        text: "Wheelchair-accessible vehicle required for community trips.",
      },
      {
        source: "upcoming_transport",
        text: MOCK_UPCOMING_EVENTS.filter((e) =>
          e.title.toLowerCase().includes("transport")
        )
          .map((e) => `${e.title} at ${e.scheduledAt}`)
          .join(" ") || "Demo bundle includes wheelchair transport to physiotherapy.",
      },
    ]);
  },
};

const casesProvider: ModuleRagProvider = {
  moduleId: "cases",
  requiredScopes: requiredScopesForModule("cases"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "cases", [
      {
        source: "open_risks",
        text: MOCK_OPEN_RISKS.map((r) => `${r.level} risk: ${r.label}`).join(
          " "
        ),
      },
      {
        source: "case_linkage",
        text: "Cases can link to care bookings, transport trips, incidents, and billing disputes.",
      },
    ]);
  },
};

const billingProvider: ModuleRagProvider = {
  moduleId: "billing",
  requiredScopes: requiredScopesForModule("billing"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "billing", [
      {
        source: "plan_managed",
        text: "Plan-managed funding: invoices are checked against service records before payment.",
      },
      {
        source: "evidence_gaps",
        text:
          MOCK_MISSING_EVIDENCE.length > 0
            ? `Billing evidence may be incomplete: ${MOCK_MISSING_EVIDENCE[0]}.`
            : "No outstanding evidence gaps flagged for billing.",
      },
    ]);
  },
};

const jobsProvider: ModuleRagProvider = {
  moduleId: "jobs",
  requiredScopes: requiredScopesForModule("jobs"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "jobs", [
      {
        source: "inclusive_jobs",
        text: "Inclusive Jobs can draft interview transport and workplace adjustments with your consent.",
      },
      {
        source: "employment_goal",
        text:
          MOCK_GOALS.find((g) => g.domain.toLowerCase().includes("community"))
            ?.summary ?? "Community participation goals on file.",
      },
    ]);
  },
};

const calendarProvider: ModuleRagProvider = {
  moduleId: "calendar",
  requiredScopes: requiredScopesForModule("calendar"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "calendar", [
      {
        source: "unified_calendar",
        text: MOCK_UPCOMING_EVENTS.map(
          (e) => `Calendar: ${e.title} ${e.scheduledAt}`
        ).join(" "),
      },
    ]);
  },
};

const incidentsProvider: ModuleRagProvider = {
  moduleId: "incidents",
  requiredScopes: requiredScopesForModule("incidents"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "incidents", [
      {
        source: "safety_escalation",
        text: "Incidents and safety issues create a case-linked record; urgent items trigger human review.",
      },
      {
        source: "open_risks",
        text:
          MOCK_OPEN_RISKS.map((r) => `${r.level} risk: ${r.label}`).join(" ") ||
          "No open incident risks in demo data.",
      },
    ]);
  },
};

const accessProvider: ModuleRagProvider = {
  moduleId: "access",
  requiredScopes: requiredScopesForModule("access"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "access", [
      {
        source: "access_map",
        text: "MapAble Access surfaces community-reviewed place accessibility and accreditation.",
      },
      {
        source: "venue_needs",
        text: MOCK_PROFILE.accessNeeds
          .filter((a) => a.category === "mobility")
          .map((a) => a.label)
          .join(", "),
      },
    ]);
  },
};

const orchestrationProvider: ModuleRagProvider = {
  moduleId: "orchestration",
  requiredScopes: requiredScopesForModule("orchestration"),
  async retrieve(ctx) {
    if (!isMockParticipant(ctx.participantId)) return [];
    return rank(ctx, "orchestration", [
      {
        source: "care_transport_link",
        text: "Cross-module orchestration can draft linked care and wheelchair transport from one care request.",
      },
      {
        source: "idempotency",
        text: "Orchestration events are idempotent so duplicate transport drafts are not created.",
      },
    ]);
  },
};

export const MODULE_RAG_PROVIDERS: ModuleRagProvider[] = [
  prmsProvider,
  consentProvider,
  careProvider,
  transportProvider,
  casesProvider,
  billingProvider,
  jobsProvider,
  calendarProvider,
  incidentsProvider,
  accessProvider,
  orchestrationProvider,
];

export const PROVIDERS_BY_MODULE: Record<ModuleId, ModuleRagProvider> =
  Object.fromEntries(
    MODULE_RAG_PROVIDERS.map((p) => [p.moduleId, p])
  ) as Record<ModuleId, ModuleRagProvider>;
