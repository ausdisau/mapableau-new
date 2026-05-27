import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canManageProviderById } from "@/lib/providers/can-manage-provider-workers";
import { createWorkerProviderInvitation } from "@/lib/workers/worker-invitation-service";
import { isValidProviderId } from "@/app/utils/provider-admin";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
});

type RouteContext = { params: Promise<{ providerId: string }> };

export async function POST(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { providerId } = await context.params;
  if (!isValidProviderId(providerId)) {
    return jsonError("Invalid provider id", 400);
  }

  const allowed = await canManageProviderById(
    user.id,
    providerId,
    user.primaryRole
  );
  if (!allowed) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Valid email required", 400);
  }

  try {
    const result = await createWorkerProviderInvitation({
      providerId,
      email: parsed.data.email,
      invitedByUserId: user.id,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    return jsonOk(
      {
        invitation: {
          id: result.invitation.id,
          email: result.invitation.email,
          status: result.invitation.status,
          expiresAt: result.invitation.expiresAt,
          providerName: result.invitation.provider.name,
        },
        inviteUrl: `${baseUrl}${result.invitePath}`,
      },
      201
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create invitation";
    return jsonError(message, 400);
  }
}
