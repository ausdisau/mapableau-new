import { listEvents } from "@/lib/participation/events/event-service";
import { listOpportunities } from "@/lib/participation/opportunities/opportunity-service";
import type { ParticipantApprovedDiscoveryFilters } from "@/lib/participation/types";

export type DiscoveryMode = "list" | "map";

export async function discoverParticipation(params: {
  filters: ParticipantApprovedDiscoveryFilters;
  mode?: DiscoveryMode;
}) {
  const [opportunities, events] = await Promise.all([
    listOpportunities(params.filters),
    listEvents({
      domains: params.filters.domains,
      from: params.filters.dateFrom,
      to: params.filters.dateTo,
    }),
  ]);
  return {
    mode: params.mode ?? "list",
    ranking: "unranked" as const,
    filtersUsed: opportunities.filtersUsed,
    opportunities,
    events,
  };
}
