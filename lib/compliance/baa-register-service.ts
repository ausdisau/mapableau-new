import { listVendorComplianceRecords } from "@/lib/privacy/vendor-compliance-service";

export async function getBaaRegister() {
  const vendors = await listVendorComplianceRecords();
  return vendors.map((v) => ({
    vendorName: v.vendorName,
    serviceName: v.serviceName,
    baaRequired: v.baaRequired,
    baaSigned: v.baaSigned,
    handlesPhiOrEphi: v.handlesPhiOrEphi,
    reviewStatus: v.australianPrivacyReviewStatus,
    nextReviewAt: v.nextReviewAt,
  }));
}

export async function vendorsRequiringBaa() {
  const vendors = await listVendorComplianceRecords();
  return vendors.filter((v) => v.baaRequired && !v.baaSigned);
}
