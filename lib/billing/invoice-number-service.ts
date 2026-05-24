import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber(
  organisationId?: string | null
): Promise<string> {
  const prefix = organisationId
    ? `MA-${organisationId.slice(-4).toUpperCase()}`
    : "MA";
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: { startsWith: `${prefix}-${year}-` },
    },
  });
  const seq = String(count + 1).padStart(5, "0");
  return `${prefix}-${year}-${seq}`;
}
