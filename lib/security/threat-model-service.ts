import { prisma } from "@/lib/prisma";

const DEFAULT_THREATS = [
  {
    category: "account_takeover",
    threat: "Credential stuffing on login",
    impact: "high",
    likelihood: "medium",
    mitigation: "Rate limiting, passkeys, MFA",
  },
  {
    category: "participant_data_exposure",
    threat: "Cross-participant data access",
    impact: "critical",
    likelihood: "low",
    mitigation: "RBAC, field redaction, audit logs",
  },
  {
    category: "invoice_fraud",
    threat: "Fraudulent NDIS claims",
    impact: "high",
    likelihood: "medium",
    mitigation: "Human approval, idempotency, validation",
  },
];

export async function ensureDefaultThreatModel() {
  const count = await prisma.threatModelItem.count();
  if (count > 0) return;

  await prisma.threatModelItem.createMany({
    data: DEFAULT_THREATS.map((t) => ({
      ...t,
      status: "open",
    })),
  });
}

export async function listThreatModelItems() {
  await ensureDefaultThreatModel();
  return prisma.threatModelItem.findMany({ orderBy: { createdAt: "desc" } });
}
