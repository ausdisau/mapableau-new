import { prisma } from "@/lib/prisma";

import { listApproachingDeadlines } from "./deadline-engine";
import { listSafeguardSignals } from "./signals-service";

export interface ImmediateSafetyItem {
  id: string;
  label: string;
  urgency: string;
  urgencyDescription: string;
  summary: string;
  href: string;
  immediateSafetyConcern: boolean;
}

export interface QualityPulseMetric {
  id: string;
  label: string;
  value: number | string;
  denominatorExplanation: string;
  href?: string;
}

export interface QsDashboardResponse {
  disclaimer: string;
  immediateSafety: ImmediateSafetyItem[];
  approachingDeadlines: Array<{
    id: string;
    ruleCode: string;
    resourceType: string;
    resourceId: string;
    dueAt: string;
    status: string;
    timezone: string;
  }>;
  inboxCounts: {
    newSignals: number;
    criticalOpen: number;
    dismissedWithReason: number;
    converted: number;
  };
  qualityPulse: QualityPulseMetric[];
  qualityPulseTable: Array<{ metric: string; value: string; notes: string }>;
}

function urgencyDescription(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "Critical — immediate human review required";
    case "high":
      return "High — prioritise today";
    case "moderate":
      return "Moderate — schedule review";
    case "low":
      return "Low — monitor";
    default:
      return "Unassessed — triage required";
  }
}

export async function getQsDashboard(params?: {
  organisationId?: string | null;
}): Promise<QsDashboardResponse> {
  const orgId = params?.organisationId ?? undefined;

  const [immediateSignals, deadlines, newCount, criticalCount, dismissed, converted] =
    await Promise.all([
      listSafeguardSignals({
        organisationId: orgId,
        immediateOnly: true,
        status: ["new", "triaged", "linked"],
        limit: 20,
      }),
      listApproachingDeadlines({ organisationId: orgId, limit: 20 }),
      prisma.safeguardSignal.count({
        where: {
          deletedAt: null,
          status: "new",
          ...(orgId ? { organisationId: orgId } : {}),
        },
      }),
      prisma.safeguardSignal.count({
        where: {
          deletedAt: null,
          urgency: "critical",
          status: { in: ["new", "triaged", "linked"] },
          ...(orgId ? { organisationId: orgId } : {}),
        },
      }),
      prisma.safeguardSignal.count({
        where: {
          deletedAt: null,
          status: "dismissed_with_reason",
          ...(orgId ? { organisationId: orgId } : {}),
        },
      }),
      prisma.safeguardSignal.count({
        where: {
          deletedAt: null,
          status: "converted_to_case",
          ...(orgId ? { organisationId: orgId } : {}),
        },
      }),
    ]);

  const openIncidents = await prisma.incidentReport.count({
    where: {
      status: { notIn: ["resolved", "closed"] },
      ...(orgId ? { organisationId: orgId } : {}),
    },
  });

  const unresolvedComplaints = await prisma.complaint.count({
    where: {
      status: { in: ["open", "acknowledged", "investigating", "escalated"] },
      ...(orgId ? { organisationId: orgId } : {}),
    },
  });

  const credentialAlerts = await prisma.workerTrustCredential.count({
    where: {
      status: { in: ["expired", "pending"] },
    },
  });

  const immediateSafety: ImmediateSafetyItem[] = immediateSignals.map((s) => ({
    id: s.id,
    label: s.immediateSafetyConcern
      ? "Immediate safety concern"
      : "Open signal",
    urgency: s.urgency,
    urgencyDescription: urgencyDescription(s.urgency),
    summary: s.summary,
    href: `/admin/ops/quality-safeguards/inbox?signal=${s.id}`,
    immediateSafetyConcern: s.immediateSafetyConcern,
  }));

  const qualityPulse: QualityPulseMetric[] = [
    {
      id: "open_incidents",
      label: "Open incidents",
      value: openIncidents,
      denominatorExplanation: "Incidents not resolved or closed",
      href: "/admin/ops/quality-safeguards/incidents",
    },
    {
      id: "unresolved_complaints",
      label: "Unresolved complaints",
      value: unresolvedComplaints,
      denominatorExplanation: "Complaints in open investigation states",
      href: "/admin/ops/quality-safeguards/complaints",
    },
    {
      id: "credential_alerts",
      label: "Credential alerts",
      value: credentialAlerts,
      denominatorExplanation: "Worker trust credentials pending or expired",
      href: "/admin/ops/quality-safeguards/credentials",
    },
    {
      id: "new_signals",
      label: "New safeguards signals",
      value: newCount,
      denominatorExplanation: "Signals awaiting triage",
      href: "/admin/ops/quality-safeguards/inbox",
    },
  ];

  return {
    disclaimer:
      "MapAble Quality & Safeguards Ops Centre supports organisational safety and quality workflows. It is not the NDIS Commission, an approved auditor, a clinical authority, or a legal adviser. Automated signals are advisory unless marked mandatory; authorised humans confirm reportability and case outcomes.",
    immediateSafety,
    approachingDeadlines: deadlines.map((d) => ({
      id: d.id,
      ruleCode: d.ruleCode,
      resourceType: d.resourceType,
      resourceId: d.resourceId,
      dueAt: d.dueAt.toISOString(),
      status: d.status,
      timezone: d.timezone,
    })),
    inboxCounts: {
      newSignals: newCount,
      criticalOpen: criticalCount,
      dismissedWithReason: dismissed,
      converted,
    },
    qualityPulse,
    qualityPulseTable: qualityPulse.map((m) => ({
      metric: m.label,
      value: String(m.value),
      notes: m.denominatorExplanation,
    })),
  };
}
