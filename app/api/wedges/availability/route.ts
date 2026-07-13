import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { wedgesConfig } from "@/lib/config/wedges";
import { listAvailabilitySnapshots } from "@/lib/wedges/availability/availability-service";
import { filterProvidersByAvailability } from "@/lib/wedges/availability/filters";
import { MOCK_WEDGE_PROVIDERS } from "@/lib/wedges/mock-providers";
import {
  FUNDING_TYPES,
  type AvailabilityFilters,
  type ProviderAvailability,
} from "@/types/wedges";

const queryBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

const querySchema = z.object({
  availableThisWeek: queryBoolean,
  noWaitlist: queryBoolean,
  shortWaitlist: queryBoolean,
  mobileService: queryBoolean,
  telehealth: queryBoolean,
  weekend: queryBoolean,
  urgentCapacity: queryBoolean,
  fundingType: z.enum(FUNDING_TYPES).optional(),
  postcode: z.string().trim().regex(/^\d{4}$/).optional(),
  suburb: z.string().trim().min(1).optional(),
});

type AvailabilityDto = {
  id: string;
  name: string;
  suburb: string | null;
  availability: ProviderAvailability;
};

function snapshotToAvailability(snapshot: {
  id: string;
  organisationId: string | null;
  providerProfileId: string | null;
  acceptingNewParticipants: boolean;
  waitlistStatus: string;
  earliestStartDate: Date | null;
  availableDays: string[];
  afterHoursAvailable: boolean;
  weekendAvailable: boolean;
  telehealthAvailable: boolean;
  mobileServiceAvailable: boolean;
  suburbsServed: string[];
  fundingTypesAccepted: string[];
  urgentCapacity: boolean;
  lastAvailabilityUpdated: Date;
  availabilityConfidence: string;
}): ProviderAvailability {
  return {
    providerId: snapshot.providerProfileId ?? snapshot.organisationId ?? snapshot.id,
    acceptingNewParticipants: snapshot.acceptingNewParticipants,
    waitlistStatus: snapshot.waitlistStatus as ProviderAvailability["waitlistStatus"],
    earliestStartDate: snapshot.earliestStartDate?.toISOString() ?? null,
    availableDays: snapshot.availableDays,
    afterHoursAvailable: snapshot.afterHoursAvailable,
    weekendAvailable: snapshot.weekendAvailable,
    telehealthAvailable: snapshot.telehealthAvailable,
    mobileServiceAvailable: snapshot.mobileServiceAvailable,
    suburbsServed: snapshot.suburbsServed,
    fundingTypesAccepted:
      snapshot.fundingTypesAccepted as ProviderAvailability["fundingTypesAccepted"],
    urgentCapacity: snapshot.urgentCapacity,
    lastAvailabilityUpdated: snapshot.lastAvailabilityUpdated.toISOString(),
    availabilityConfidence:
      snapshot.availabilityConfidence as ProviderAvailability["availabilityConfidence"],
  };
}

export async function GET(request: Request) {
  if (!wedgesConfig.mvpEnabled) {
    return jsonError("Wedges MVP is not enabled", 404);
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const filters: AvailabilityFilters = parsed.data;

  if (wedgesConfig.useMockData) {
    const providers = filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, filters);
    const dto: AvailabilityDto[] = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      suburb: provider.suburb,
      availability: provider.availability,
    }));
    return jsonOk({ source: "mock", count: dto.length, providers: dto });
  }

  const snapshots = await listAvailabilitySnapshots(filters);
  const dto: AvailabilityDto[] = snapshots.map((snapshot) => ({
    id: snapshot.providerProfileId ?? snapshot.organisationId ?? snapshot.id,
    name: "Provider availability",
    suburb: snapshot.suburbsServed[0] ?? null,
    availability: snapshotToAvailability(snapshot),
  }));

  return jsonOk({ source: "database", count: dto.length, providers: dto });
}

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!wedgesConfig.mvpEnabled) {
    return jsonError("Wedges MVP is not enabled", 404);
  }

  return jsonOk({
    message:
      "Availability update accepted (placeholder). Link provider console /provider/availability for the full workflow.",
    userId: user.id,
  });
}
