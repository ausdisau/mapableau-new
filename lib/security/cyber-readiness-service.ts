import { phase5Config } from "@/lib/config/phase5";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export type ReadinessItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "blocker";
  detail: string;
  href?: string;
};

export async function getCyberReadinessChecklist(): Promise<ReadinessItem[]> {
  const controls = await prisma.securityControl.count();
  const threats = await prisma.threatModelItem.count();
  const recentEvents = await prisma.securityEvent.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  return [
    {
      id: "auth_mfa",
      label: "Authentication and MFA",
      status: remainingSystemsConfig.passkeysEnabled ? "pass" : "warn",
      detail: remainingSystemsConfig.passkeysEnabled
        ? "Passkeys enabled"
        : "Passkeys not enabled — optional but recommended",
      href: "/settings/security/passkeys",
    },
    {
      id: "rbac",
      label: "RBAC and permissions",
      status: "pass",
      detail: "Role matrix active in lib/auth/permissions",
    },
    {
      id: "audit",
      label: "Audit logging",
      status: "pass",
      detail: "Audit events service in use",
      href: "/admin/audit-events",
    },
    {
      id: "rate_limit",
      label: "API abuse protection",
      status: phase5Config.apiRateLimitingEnabled ? "pass" : "blocker",
      detail: phase5Config.apiRateLimitingEnabled
        ? "Rate limiting enabled"
        : "Enable API_RATE_LIMITING_ENABLED",
    },
    {
      id: "controls",
      label: "Security controls register",
      status: controls > 0 ? "pass" : "warn",
      detail: `${controls} controls tracked`,
      href: "/admin/security/controls",
    },
    {
      id: "threat_model",
      label: "Threat model",
      status: threats > 0 ? "pass" : "warn",
      detail: `${threats} threat items documented`,
      href: "/admin/security/threat-model",
    },
    {
      id: "ndis",
      label: "NDIA API readiness",
      status: remainingSystemsConfig.ndisIntegrationLayerEnabled
        ? "pass"
        : "warn",
      detail: "NDIS integration layer configurable",
      href: "/admin/ndis-readiness",
    },
    {
      id: "events",
      label: "Security events (24h)",
      status: recentEvents > 1000 ? "warn" : "pass",
      detail: `${recentEvents} events in last 24 hours`,
    },
  ];
}
