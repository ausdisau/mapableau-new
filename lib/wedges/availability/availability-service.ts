import { wedgesConfig } from "@/lib/config/wedges";
import { prisma } from "@/lib/prisma";
import { isAvailableThisWeek } from "@/lib/wedges/availability/filters";
import type {
  AvailabilityFilters,
  ProviderAvailability,
} from "@/types/wedges";

export async function listAvailabilitySnapshots(filters: AvailabilityFilters) {
  const rows = await prisma.providerAvailabilitySnapshot.findMany({
    where: {
      ...(filters.noWaitlist ? { waitlistStatus: "none" } : {}),
      ...(filters.shortWaitlist
        ? { waitlistStatus: { in: ["none", "short"] } }
        : {}),
      ...(filters.telehealth ? { telehealthAvailable: true } : {}),
      ...(filters.mobileService ? { mobileServiceAvailable: true } : {}),
      ...(filters.weekend ? { weekendAvailable: true } : {}),
      ...(filters.urgentCapacity ? { urgentCapacity: true } : {}),
      ...(filters.fundingType
        ? { fundingTypesAccepted: { has: filters.fundingType } }
        : {}),
      ...(filters.suburb
        ? {
            suburbsServed: {
              has: filters.suburb,
            },
          }
        : {}),
    },
    take: 100,
    orderBy: { lastAvailabilityUpdated: "desc" },
  });

  const profileIds = rows
    .map((row) => row.providerProfileId)
    .filter((id): id is string => Boolean(id));
  const profiles = profileIds.length
    ? await prisma.providerProfile.findMany({
        where: { id: { in: profileIds } },
        select: { id: true, postcode: true },
      })
    : [];
  const postcodeByProfile = new Map(
    profiles.map((profile) => [profile.id, profile.postcode]),
  );

  const enriched = rows.map((row) => ({
    ...row,
    serviceAreaPostcodes: row.providerProfileId
      ? [postcodeByProfile.get(row.providerProfileId)].filter(
          (value): value is string => Boolean(value),
        )
      : [],
  }));

  return enriched.filter((row) => {
    const availability: ProviderAvailability & {
      serviceAreaPostcodes?: string[];
    } = {
      providerId: row.providerProfileId ?? row.organisationId ?? row.id,
      acceptingNewParticipants: row.acceptingNewParticipants,
      waitlistStatus: row.waitlistStatus as ProviderAvailability["waitlistStatus"],
      earliestStartDate: row.earliestStartDate?.toISOString() ?? null,
      availableDays: row.availableDays,
      afterHoursAvailable: row.afterHoursAvailable,
      weekendAvailable: row.weekendAvailable,
      telehealthAvailable: row.telehealthAvailable,
      mobileServiceAvailable: row.mobileServiceAvailable,
      suburbsServed: row.suburbsServed,
      fundingTypesAccepted:
        row.fundingTypesAccepted as ProviderAvailability["fundingTypesAccepted"],
      urgentCapacity: row.urgentCapacity,
      lastAvailabilityUpdated: row.lastAvailabilityUpdated.toISOString(),
      availabilityConfidence:
        row.availabilityConfidence as ProviderAvailability["availabilityConfidence"],
      serviceAreaPostcodes: row.serviceAreaPostcodes,
    };

    if (filters.availableThisWeek && !isAvailableThisWeek(availability)) {
      return false;
    }
    if (
      filters.postcode &&
      !availability.serviceAreaPostcodes?.includes(filters.postcode.trim())
    ) {
      return false;
    }
    return true;
  });
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
    return { persisted: false, id: `local-${crypto.randomUUID()}` };
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
