import { prisma } from "@/lib/prisma";

export async function recordCareRequestStatusHistory(params: {
  careRequestId: string;
  toStatus: string;
  fromStatus?: string | null;
  actorUserId?: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    await prisma.careRequestStatusHistory.create({
      data: {
        careRequestId: params.careRequestId,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus,
        actorUserId: params.actorUserId ?? null,
        note: params.note ?? null,
      },
    });
  } catch {
    // Table may be missing until migration
  }
}
