import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  shareVaultItem,
  shareVaultItemSchema,
  vaultErrorResponse,
} from "@/lib/privacy/participant-vault";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`vault-share:${user.id}:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("Too many share requests", 429);
  }

  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const parsed = shareVaultItemSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const grant = await shareVaultItem({
      userId: user.id,
      itemId: id,
      granteeUserId: parsed.data.granteeUserId,
      purpose: parsed.data.purpose,
      expiresAt: new Date(parsed.data.expiresAt),
    });
    return jsonOk({ grant }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
