import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson, fedZodError } from "@/lib/api/federation-response";
import {
  listAuthoritiesForParticipant,
  proposeDelegateAuthority,
  proposeDelegateAuthoritySchema,
} from "@/lib/delegation/authority";

export async function GET() {
  const user = await requireApiPermission("delegate:read:self");
  if (user instanceof Response) return user;
  const authorities = await listAuthoritiesForParticipant(user.id);
  return fedJson({ authorities });
}

export async function POST(request: Request) {
  const user = await requireApiPermission("delegate:manage:self");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return fedJson({ error: "invalid_json" }, 400);
  }
  const parsed = proposeDelegateAuthoritySchema.safeParse({
    ...raw,
    participantId: user.id,
    actorId: user.id,
  });
  if (!parsed.success) return fedZodError(parsed.error);
  try {
    const result = await proposeDelegateAuthority(parsed.data);
    return fedJson({ authority: result.authority }, 201);
  } catch (err) {
    return fedJson(
      { error: err instanceof Error ? err.message : "propose_failed" },
      400
    );
  }
}
