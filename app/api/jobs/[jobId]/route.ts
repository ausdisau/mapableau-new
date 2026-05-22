import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employerOrganisation: { select: { name: true } } },
  });
  if (!job) return jsonError("Not found", 404);
  return jsonOk({ job });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const body = await req.json();
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      title: body.title,
      description: body.description,
      accessibilityFeatures: body.accessibilityFeatures,
    },
  });
  return jsonOk({ job });
}
