import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson } from "@/lib/api/federation-response";
import { getOrDraftWallet, activateWallet } from "@/lib/wallet/accounts";
import { createRecoveryPolicy } from "@/lib/wallet/recovery";
import { z } from "zod";

export async function GET() {
  const user = await requireApiPermission("wallet:read:self");
  if (user instanceof Response) return user;
  const wallet = await getOrDraftWallet(user.id);
  return fedJson({ wallet });
}

const activateSchema = z.object({
  method: z.enum([
    "none",
    "operator_assisted",
    "guardian_shard",
    "hardware_recovery_kit",
    "offline_paper_kit",
  ]),
  quorum: z.number().min(1).max(10).default(1),
  operatorAssistAllowed: z.boolean().default(false),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("wallet:activate:self");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = activateSchema.safeParse(raw);
  if (!parsed.success) return fedJson({ error: "validation_failed" }, 400);
  const policy = await createRecoveryPolicy({
    method: parsed.data.method,
    quorum: parsed.data.quorum,
    operatorAssistAllowed: parsed.data.operatorAssistAllowed,
  });
  const wallet = await activateWallet({
    participantId: user.id,
    actorId: user.id,
    recoveryPolicyId: policy.id,
  });
  return fedJson({ wallet, policyId: policy.id }, 201);
}
