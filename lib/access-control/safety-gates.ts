import { prisma } from "@/lib/prisma";
import { PanelAccessError } from "@/lib/access-control/panel-access";

export async function assertProviderBookingEligible(
  organisationId: string
): Promise<void> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      bookingEligible: true,
      verificationStatus: true,
      status: true,
    },
  });
  if (!org) {
    throw new PanelAccessError("NOT_FOUND", "Provider organisation not found.");
  }
  if (org.status !== "active") {
    throw new PanelAccessError(
      "SAFETY_GATE",
      "Provider organisation is not active and cannot receive bookings."
    );
  }
  if (org.verificationStatus !== "verified" || !org.bookingEligible) {
    throw new PanelAccessError(
      "SAFETY_GATE",
      "Provider is not booking eligible. Complete verification and safeguarding checks first."
    );
  }
}

export async function assertWorkerMatchEligible(
  workerProfileId: string
): Promise<void> {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    include: {
      screeningChecks: { where: { checkType: "ndis_worker_screening" } },
    },
  });
  if (!worker || !worker.active) {
    throw new PanelAccessError("SAFETY_GATE", "Worker profile is not active.");
  }
  if (
    worker.workerScreeningStatus !== "verified" &&
    worker.verificationStatus !== "verified"
  ) {
    const screening = worker.screeningChecks[0];
    if (!screening || screening.status !== "verified") {
      throw new PanelAccessError(
        "SAFETY_GATE",
        "Worker cannot be matched until NDIS worker screening is verified."
      );
    }
  }
}

export async function assertDriverDispatchEligible(
  driverProfileId: string,
  vehicleId?: string | null
): Promise<void> {
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
  });
  if (!driver || !driver.active) {
    throw new PanelAccessError("SAFETY_GATE", "Driver profile is not active.");
  }
  if (driver.licenceStatus !== "verified") {
    throw new PanelAccessError(
      "SAFETY_GATE",
      "Driver cannot be dispatched until licence checks pass."
    );
  }
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { verificationStatus: true, active: true },
    });
    if (!vehicle?.active || vehicle.verificationStatus !== "verified") {
      throw new PanelAccessError(
        "SAFETY_GATE",
        "Assigned vehicle must pass compliance checks before dispatch."
      );
    }
  }
}

export async function assertHighRiskSupportCredentials(
  workerProfileId: string,
  requiredCredentials: string[] = ["manual_handling", "medication_support"]
): Promise<void> {
  const docs = await prisma.credentialDocument.findMany({
    where: {
      workerProfileId,
      credentialType: { in: requiredCredentials },
      status: "verified",
    },
  });
  const missing = requiredCredentials.filter(
    (c) => !docs.some((d) => d.credentialType === c)
  );
  if (missing.length > 0) {
    throw new PanelAccessError(
      "SAFETY_GATE",
      `High-risk support requires verified credentials: ${missing.join(", ")}.`
    );
  }
}

export function assertSafeguardingChannel(
  conversationType: string,
  category?: string
): void {
  if (
    category === "complaint" ||
    category === "safeguarding_concern" ||
    conversationType === "support_ticket_thread"
  ) {
    return;
  }
}
