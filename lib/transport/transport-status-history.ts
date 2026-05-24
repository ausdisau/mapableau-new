import { prisma } from "@/lib/prisma";

export async function recordTransportStatusHistory(params: {
  transportBookingId: string;
  toStatus: string;
  fromStatus?: string | null;
  actorUserId?: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    await prisma.transportStatusHistory.create({
      data: {
        transportBookingId: params.transportBookingId,
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
