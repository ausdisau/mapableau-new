import type { SchedulingEngine } from "@/lib/scheduling/scheduling-engine";
import { getTravelTimeSeconds } from "@/lib/routing/travel-matrix-service";
import type { SchedulingProblem, SchedulingProposal } from "@/types/scheduling";

export class HeuristicSchedulingEngine implements SchedulingEngine {
  readonly engine = "heuristic" as const;

  async proposeAssignments(
    input: SchedulingProblem
  ): Promise<SchedulingProposal> {
    const window = input.windows[0];
    if (!window || input.resources.length === 0) {
      return { assignments: [], engine: "heuristic", score: 0 };
    }

    const assignments = [];
    let bestScore = -1;

    for (const resource of input.resources) {
      let travelPenalty = 0;
      if (input.pickup && resource.siteLat != null && resource.siteLng != null) {
        const travel = await getTravelTimeSeconds(
          { lat: resource.siteLat, lng: resource.siteLng },
          input.pickup
        );
        travelPenalty = travel.durationSeconds / 60;
      }

      const score = Math.max(0, 100 - travelPenalty);
      if (score > bestScore) {
        bestScore = score;
        assignments.length = 0;
        assignments.push({
          resourceType: resource.type,
          resourceId: resource.id,
          startsAt: window.start,
          endsAt: window.end,
          score,
          explanation: `Earliest feasible slot with ~${Math.round(travelPenalty)} min travel.`,
        });
      }
    }

    return {
      assignments,
      engine: "heuristic",
      score: bestScore,
    };
  }
}
