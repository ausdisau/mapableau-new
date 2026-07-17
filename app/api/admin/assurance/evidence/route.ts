import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  attachAssuranceEvidence,
  listAssuranceEvidence,
} from "@/lib/assurance/evidence/evidence-service";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  controlId: z.string().min(1),
  title: z.string().min(1),
  evidenceType: z.enum([
    "policy",
    "procedure",
    "config_export",
    "log_export",
    "screenshot",
    "test_result",
    "attestation",
    "third_party_report",
    "architecture_diagram",
    "other",
  ]),
  classification: z
    .enum(["public", "internal", "confidential", "restricted"])
    .optional(),
  summary: z.string().optional(),
  documentId: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("assurance:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const controlId = url.searchParams.get("controlId") ?? undefined;
  const evidence = await listAssuranceEvidence({ controlId, currentOnly: true });
  return jsonOk({
    evidence,
    disclaimer: "Evidence inventory only — no secrets or identity documents.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("assurance:evidence:write");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const evidence = await attachAssuranceEvidence({
    ...parsed.data,
    collectedById: user.id,
  });
  return jsonOk({ evidence });
}
