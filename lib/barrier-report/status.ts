import type { AccessBarrierReportStatus } from "@prisma/client";
import { z } from "zod";

export const BARRIER_REPORT_STATUSES = [
  "draft",
  "received",
  "reviewing",
  "actioned",
  "closed",
] as const satisfies readonly AccessBarrierReportStatus[];

export const providerBarrierStatusSchema = z.enum([
  "received",
  "reviewing",
  "actioned",
  "closed",
]);

export type ProviderBarrierStatus = z.infer<typeof providerBarrierStatusSchema>;

/** Allowed provider workflow transitions (no return to draft). */
export const PROVIDER_STATUS_TRANSITIONS: Record<
  Exclude<AccessBarrierReportStatus, "draft">,
  Array<Exclude<AccessBarrierReportStatus, "draft">>
> = {
  received: ["reviewing", "closed"],
  reviewing: ["actioned", "closed"],
  actioned: ["closed"],
  closed: [],
};

export function canTransitionBarrierStatus(
  from: AccessBarrierReportStatus,
  to: AccessBarrierReportStatus,
): boolean {
  if (from === "draft" || to === "draft") return false;
  if (from === to) return true;
  return PROVIDER_STATUS_TRANSITIONS[from].includes(to);
}
