import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { wedgesConfig } from "@/lib/config/wedges";
import { listAvailabilitySnapshots } from "@/lib/wedges/availability/availability-service";
import { filterProvidersByAvailability } from "@/lib/wedges/availability/filters";
import { MOCK_WEDGE_PROVIDERS } from "@/lib/wedges/mock-providers";
import { FUNDING_TYPES, type AvailabilityFilters, type ProviderAvailability } from "@/types/wedges";

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

function snapshotToAvailability(snapshot: Awaited<ReturnType<typeof listAvailabilitySnapshots>>[number]): ProviderAvailability {
  return {
    providerId: snapshot.providerProfileId ?? snapshot.organisationId ?? snapshot.id,
    acceptingNewParticipants: snapshot.acceptingNewParticipants,
    waitlistStatus: snapshot.waitlistStatus as ProviderAvailability["waitlistStatus"],
    earliestStartDate: snapshot.earliest