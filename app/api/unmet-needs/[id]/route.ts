import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { convertUnmetNeedToWaitlist } from "@/lib/unmet-needs/unmet-need-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const record = await prisma.unmetNeedRecord.findUnique({ where: { id } });
  return jsonOk({ record });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (body.convertToWaitlist) {
    const waitlist = await convertUnmetNeedToWaitlist(id, user.id);
    return jsonOk({ waitlist });
  }
  const record = await prisma.unmetNeedRecord.update({
    where: { id },
    data: { status: body.status, description: body.description },
  });
  return jsonOk({ record });
}
