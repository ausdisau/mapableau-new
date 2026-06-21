import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:audit:read");
  if (denied) return denied;

  const url = new URL(req.url);
  const entityId = url.searchParams.get("entityId") ?? undefined;
  const take = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const events = await prisma.auditEvent.findMany({
    where: {
      action: { startsWith: "abilitypay." },
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actorUser: { select: { id: true, name: true, email: true } },
    },
  });

  return jsonOk({ events });
}
