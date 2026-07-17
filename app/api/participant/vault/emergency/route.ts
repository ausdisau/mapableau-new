import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import { requestEmergencyAccess } from "@/lib/access-passport/emergency";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string().min(1),
  scope: z.enum([
    "contact_only",
    "accessibility_only",
    "medical_instruction_only",
    "service_history_only",
    "full_break_glass",
  ]),
  claimedContext: z.string().min(5),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("vault:emergency:invoke:self");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fedZodError(parsed.error);
  const result = await requestEmergencyAccess({
    subjectId: parsed.data.subjectId,
    requesterId: user.id,
    scope: parsed.data.scope,
    claimedContext: parsed.data.claimedContext,
  });
  return fedJson({ request: result }, 201);
}
