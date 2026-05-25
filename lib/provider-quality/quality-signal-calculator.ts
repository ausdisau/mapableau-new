import type { ProviderQualitySignalCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { labelForNewProvider } from "./quality-signal-policy";

export async function calculateQualitySignals(organisationId: string) {
  const [bookings, incidents, org] = await Promise.all([
    prisma.booking.count({
      where: { assignedOrganisationId: organisationId, status: "completed" },
    }),
    prisma.incidentReport.count({ where: { organisationId } }),
    prisma.organisation.findUnique({ where: { id: organisationId } }),
  ]);

  const isNew = bookings < 5;
  const signals: {
    category: ProviderQualitySignalCategory;
    label: string;
    explanation: string;
    visiblePublic: boolean;
    numericValue?: number;
  }[] = [];

  if (org?.verificationStatus === "verified") {
    signals.push({
      category: "verification_status",
      label: "Verified information available",
      explanation: "Provider verification checks are on file.",
      visiblePublic: true,
    });
  }

  if (isNew) {
    signals.push({
      category: "booking_completion_rate",
      label: labelForNewProvider(),
      explanation: "Limited booking history — signals will improve over time.",
      visiblePublic: true,
    });
  } else if (bookings >= 10) {
    signals.push({
      category: "booking_completion_rate",
      label: "Reliable booking history",
      explanation: `Based on ${bookings} completed bookings.`,
      visiblePublic: true,
      numericValue: bookings,
    });
  }

  if (incidents > 0) {
    signals.push({
      category: "incident_rate",
      label: "Quality information unavailable",
      explanation: "Incident details are not shown publicly.",
      visiblePublic: false,
    });
  } else {
    signals.push({
      category: "response_time",
      label: "Responds quickly",
      explanation: "Typical response within platform targets.",
      visiblePublic: true,
    });
  }

  return signals;
}
