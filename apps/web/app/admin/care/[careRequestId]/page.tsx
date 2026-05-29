import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCareDetailPage({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  await requireAdmin();
  const { careRequestId } = await params;
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: { assignedOrganisation: true, shifts: true },
  });
  if (!request) return <p>Not found</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
      <p>{request.description}</p>
      <p className="text-sm">
        Assigned org: {request.assignedOrganisation?.name ?? "None"}
      </p>
      <p className="text-sm">Shifts: {request.shifts.length}</p>
    </div>
  );
}
