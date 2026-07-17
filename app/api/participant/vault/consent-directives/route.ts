import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import {
  consentDirectiveInputSchema,
  listActiveDirectivesForSubject,
  writeConsentDirective,
} from "@/lib/consent-v2/directives";

export async function GET() {
  const user = await requireApiPermission("consent_directive:read:self");
  if (user instanceof Response) return user;
  const directives = await listActiveDirectivesForSubject(user.id);
  return fedJson({ directives });
}

export async function POST(request: Request) {
  const user = await requireApiPermission("consent_directive:manage:self");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return fedJson({ error: "invalid_json" }, 400);
  }
  const parsed = consentDirectiveInputSchema.safeParse({
    ...raw,
    subjectId: user.id,
    authorId: user.id,
  });
  if (!parsed.success) return fedZodError(parsed.error);
  const result = await writeConsentDirective(parsed.data);
  return fedJson(
    {
      directive: result.directive,
      receiptId: result.receiptId,
      supersededPreviousId: result.supersededPreviousId,
    },
    201
  );
}
