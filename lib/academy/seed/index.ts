import type { PrismaClient } from "@prisma/client";

import { seedMapAbleWorkerFoundations } from "@/lib/academy/seed/worker-foundations";

/** Idempotent Academy domain seed for demos and local/dev. */
export async function seedAcademy(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });

  return seedMapAbleWorkerFoundations(prisma, {
    publisherUserId: admin?.id,
  });
}
