import { vendorAllowsEphiProcessing } from "@/lib/privacy/vendor-compliance-service";

export class HipaaBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HipaaBoundaryError";
  }
}

/**
 * HIPAA-ready control: block production ePHI processing through vendors
 * without compliance review. Does not imply HIPAA certification.
 */
export async function assertVendorAllowsProcessing(
  vendorName: string,
  serviceName: string,
  options?: { allowNonProduction?: boolean }
): Promise<void> {
  if (options?.allowNonProduction && process.env.NODE_ENV !== "production") {
    return;
  }
  const allowed = await vendorAllowsEphiProcessing(vendorName, serviceName);
  if (!allowed) {
    throw new HipaaBoundaryError(
      `Vendor ${vendorName}/${serviceName} is not approved for ePHI processing. BAA and privacy review required.`
    );
  }
}
