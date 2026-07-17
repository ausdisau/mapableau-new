import { recordVulnerabilityFinding } from "@/lib/assurance/vulnerabilities/vulnerability-register";

/** Register that a pen-test engagement occurred — does not fabricate certification. */
export async function recordPenetrationTestEngagement(params: {
  title: string;
  organisationId?: string | null;
  ownerUserId?: string | null;
  findingsCount: number;
}) {
  return recordVulnerabilityFinding({
    title: params.title,
    severity: params.findingsCount > 0 ? "high" : "informational",
    source: "penetration_test_register",
    organisationId: params.organisationId,
    ownerUserId: params.ownerUserId,
    summary: `Penetration test engagement recorded with ${params.findingsCount} findings. Not a certification.`,
  });
}
