import type { ComplaintType, DisputeType } from "@prisma/client";

export const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  invoice_dispute: "Invoice or charge concern",
  service_not_delivered: "Service was not delivered",
  no_show: "No show",
  late_arrival: "Late arrival",
  wrong_worker_or_driver: "Wrong worker or driver",
  access_need_not_met: "Access need was not met",
  overcharge_concern: "Possible overcharge",
  quality_concern: "Quality of service",
};

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  unsafe_service: "Unsafe service",
  privacy_concern: "Privacy concern",
  discrimination_or_disrespect: "Discrimination or disrespect",
  communication_issue: "Communication issue",
  provider_conduct: "Provider conduct",
  worker_conduct: "Worker or driver conduct",
  platform_issue: "MapAble platform issue",
  other: "Other concern",
};

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
