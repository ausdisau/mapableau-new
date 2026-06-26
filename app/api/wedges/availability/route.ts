import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { wedgesConfig } from "@/lib/config/wedges";
import { listAvailabilitySnapshots } from "@/lib/wedges/availability/availability-service";
import { filterProvidersByAvailability } from "@/lib/wedges/availability/filters";
import { MOCK_WEDGE_PROVIDERS } from "@/lib/wedges/mock-providers";
import type { AvailabilityFilters } from "@/types/wedges";

const querySchema = z.object({
  availableThisWeek: z.coerce.boolean().optional(),
  noWaitlist: z.coerce.boolean().optional(),
  shortWaitlist: z.coerce.boolean().optional(),
  mobileService: z.coerce.boolean().optional(),
  telehealth: z.coerce.boolean().optional(),
  weekend: z.coerce.boolean().optional(),
  urgentCapacity: z.coerce.boolean().optional(),
  fundingType: z.string().optional(),
  postcode: z.string().optional(),
  suburb: z.string().optional(),
});

export async function GET(request: Request) {
  if (!wedgesConfig.mvpEnabled) {
    return jsonError("Wedges MVP is not enabled", 404);
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const filters = parsed.data as AvailabilityFilters;

  if (wedgesConfig.useMockData) {
    const providers = filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, filters);
    return jsonOk({
      source: "mock",
      count: providers.length,
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        suburb: p.suburb,
        availability: p.availability,
      })),
    });
  }

  const snapshots = await listAvailabilitySnapshots(filters);
  return jsonOk({ source: "database", count: snapshots.length, providers: snapshots });
}

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!wedgesConfig.mvpEnabled) {
    return jsonError("Wedges MVP is not enabled", 404);
  }

  // Provider admin placeholder for updating availability
  return jsonOk({
    message: "Availability update accepted (placeholder). Link provider console /provider/availability for full workflow.",
    userId: user.id,
  });
}
