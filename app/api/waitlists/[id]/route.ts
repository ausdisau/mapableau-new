import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateWaitlistStatus } from "@/lib/capacity/waitlist-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const waitlist = await prisma.waitlistRequest.findUnique({ where: { id } });
  return jsonOk({ waitlist });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  const waitlist = await updateWaitlistStatus(id, body.status, user.id);
  return jsonOk({ waitlist });
}
