/**
 * Thin service-management wrapper. MapAble Wave 8 does not embed a full ITSM
 * system. This module records the shape of a service-management ticket so
 * external systems (Jira, Zendesk, PagerDuty) can be linked by reference.
 */

export type TicketPriority = "P1" | "P2" | "P3" | "P4";

export interface ServiceManagementTicketRef {
  externalKey: string;
  system: "jira" | "zendesk" | "pagerduty" | "linear" | "other";
  organisationId: string | null;
  priority: TicketPriority;
  status: "open" | "in_progress" | "resolved" | "closed";
  summary: string;
  createdAt: string;
}

export function normaliseTicketRef(
  input: Partial<ServiceManagementTicketRef>
): ServiceManagementTicketRef {
  if (!input.externalKey) {
    throw new Error("SERVICE_TICKET_EXTERNAL_KEY_REQUIRED");
  }
  if (!input.system) {
    throw new Error("SERVICE_TICKET_SYSTEM_REQUIRED");
  }
  return {
    externalKey: input.externalKey,
    system: input.system,
    organisationId: input.organisationId ?? null,
    priority: input.priority ?? "P3",
    status: input.status ?? "open",
    summary: input.summary ?? "",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
