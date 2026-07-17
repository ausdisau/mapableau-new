import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import { evaluateConsentDirective } from "@/lib/consent-v2/evaluation";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string().min(1),
  purpose: z.string().min(1),
  recipientCategory: z.string().min(1),
  recipientOrganisationId: z.string().nullish(),
  scopeKey: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("federation:disclosure:manage:any");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fedZodError(parsed.error);
  const result = await evaluateConsentDirective({
    subjectId: parsed.data.subjectId,
    // Casting is safe because Prisma will reject invalid enum members at query time.
    purpose: parsed.data.purpose as never,
    recipientCategory: parsed.data.recipientCategory as never,
    recipientOrganisationId: parsed.data.recipientOrganisationId ?? null,
    scopeKey: parsed.data.scopeKey,
  });
  return fedJson(result);
}
