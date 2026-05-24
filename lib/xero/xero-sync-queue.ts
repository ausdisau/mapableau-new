import { prisma } from "@/lib/prisma";

export async function enqueueXeroSync(invoiceId: string, organisationId: string) {
  const pending = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId, syncStatus: { in: ["pending", "syncing"] } },
  });
  if (pending) return pending;

  return prisma.xeroInvoiceSyncRecord.create({
    data: {
      invoiceId,
      organisationId,
      syncStatus: "pending",
    },
  });
}
