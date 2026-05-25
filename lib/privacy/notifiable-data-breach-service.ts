import { logAuthAudit } from "@/lib/auth/auth-audit-service";

/** Placeholder for OAIC notifiable data breach workflow — requires legal process */
export async function recordBreachPlaceholder(input: {
  reportedByUserId?: string;
  summary: string;
  severity: "low" | "medium" | "high";
}) {
  await logAuthAudit({
    userId: input.reportedByUserId,
    action: "privacy.breach_placeholder",
    metadata: {
      summary: input.summary,
      severity: input.severity,
      note: "Not a formal NDB submission — legal review required",
    },
  });
  return {
    id: `ndb-placeholder-${Date.now()}`,
    status: "recorded_placeholder",
  };
}
