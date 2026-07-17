export type PublicStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export interface PublicStatusReport {
  status: PublicStatus;
  message: string;
  updatedAt: string;
  disclaimer: string;
}

const DEFAULT_DISCLAIMER =
  "Public status is a summary. It does not describe individual tenant availability. See tenant status for that.";

export function reportPublicStatus(input: {
  status?: PublicStatus;
  message?: string;
}): PublicStatusReport {
  return {
    status: input.status ?? "operational",
    message: input.message ?? "All systems reporting green from the MapAble side.",
    updatedAt: new Date().toISOString(),
    disclaimer: DEFAULT_DISCLAIMER,
  };
}
