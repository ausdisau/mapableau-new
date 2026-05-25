import { prisma } from "@/lib/prisma";

export async function listVendorComplianceRecords() {
  return prisma.vendorComplianceRecord.findMany({
    orderBy: [{ vendorName: "asc" }, { serviceName: "asc" }],
  });
}

export async function getVendorCompliance(
  vendorName: string,
  serviceName: string
) {
  return prisma.vendorComplianceRecord.findUnique({
    where: { vendorName_serviceName: { vendorName, serviceName } },
  });
}

export async function vendorAllowsEphiProcessing(
  vendorName: string,
  serviceName: string
): Promise<boolean> {
  const record = await getVendorCompliance(vendorName, serviceName);
  if (!record) return false;
  if (!record.handlesPhiOrEphi && !record.handlesHealthInformation) {
    return true;
  }
  if (record.baaRequired && !record.baaSigned) return false;
  return record.australianPrivacyReviewStatus === "approved";
}
