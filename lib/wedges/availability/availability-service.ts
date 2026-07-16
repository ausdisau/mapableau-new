import type { AvailabilityFilters } from "@/types/wedges";
import { wedgesConfig } from "@/lib/config/wedges";
import { prisma } from "@/lib/prisma";
import { filterProvidersByAvailability } from "@/lib/wedges/availability/filters";
import { MOCK_WEDGE_PROVIDERS } from "@/lib/wedges/mock-providers";

export async function listAvailabilitySnapshots(filters: AvailabilityFilters) {
  if (wedgesConfig.useMockData) {
    return filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, filters);
  }

  const rows = await prisma.providerAvailabilitySnapshot.findMany({
    where: {
      ...(filters.noWaitlist ? { waitlistStatus: "none" } : {}),
      ...(filters.telehealth ? { telehealthAvailable: true } : {}),
      ...(filters.mobileService ? { mobileServiceAvailable: true } : {}),
      ...(filters.weekend ? { weekendAvailable: true } : {}),
      ...(filters.urgentCapacity ? { urgentCapacity: true } : {}),
    },
    take: 100,
    orderBy: { lastAvailabilityUpdated: "desc" },
  });

  return rows;
}

export async function createSupportConciergeRequest(data: {
  requesterRole: string;
  supportCategory: string;
  locationPostcode: string;
  locationSuburb: string;
  serviceMode: string;
  urgency: string;
  accessNeeds: string[];
  fundingType: string;
  previousIssues?: string;
  consentGiven: boolean;
  userId?: string;
  summaryJson?: unknown;
}) {
  if (!wedgesConfig.persistRequests) {
    return { persisted: false, id: `local-${Date.now()}` };
  }

  const record = await prisma.supportConciergeRequest.create({
    data: {
      requesterRole: data.requesterRole,
      supportCategory: data.supportCategory,
      locationPostcode: data.locationPostcode,
      locationSuburb: data.locationSuburb,
      serviceMode: data.serviceMode,
      urgency: data.urgency,
      accessNeeds: data.accessNeeds,
      fundingType: data.fundingType,
      previousIssues: data.previousIssues,
      consentGiven: data.consentGiven,
      userId: data.userId,
      summaryJson: data.summaryJson as object | undefined,
    },
  });

  return { persisted: true, id: record.id };
}
