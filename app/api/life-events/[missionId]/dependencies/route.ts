import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import {
  isDependencyGraphEnabled,
  isLifeEventsEnabled,
} from "@/lib/continuity-os/feature-flags";
import { dependencyProjectionAsList } from "@/lib/continuity-os/dependencies/projection";
import { getLifeEventMission } from "@/lib/continuity-os/missions/life-event-service";
import { projectDependenciesFromTemplate } from "@/lib/continuity-os/dependencies/projection";

type Params = { params: Promise<{ missionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
    if (disabled) return disabled;
    const graphDisabled = disabledIf(
      isDependencyGraphEnabled(),
      "DEPENDENCY_GRAPH_DISABLED"
    );
    if (graphDisabled) return graphDisabled;

    const { missionId } = await params;
    const { extension, definition, snapshot } = await getLifeEventMission(
      missionId,
      user.id
    );

    const projection =
      snapshot != null
        ? {
            nodes: snapshot.nodesJson as ReturnType<
              typeof projectDependenciesFromTemplate
            >["nodes"],
            edges: snapshot.edgesJson as ReturnType<
              typeof projectDependenciesFromTemplate
            >["edges"],
            responsibilities: snapshot.responsibilitiesJson as ReturnType<
              typeof projectDependenciesFromTemplate
            >["responsibilities"],
            unknowns: snapshot.unknownsJson as string[],
            blockers: snapshot.blockersJson as string[],
            singlePointsOfFailure: projectDependenciesFromTemplate({
              definition,
              participantGoal: extension.participantGoal,
              unknowns: snapshot.unknownsJson as string[],
              blockers: snapshot.blockersJson as string[],
            }).singlePointsOfFailure,
          }
        : projectDependenciesFromTemplate({
            definition,
            participantGoal: extension.participantGoal,
            unknowns: extension.unknownsJson as string[],
            blockers: extension.blockersJson as string[],
          });

    return Response.json({
      projection,
      listAlternative: dependencyProjectionAsList(projection),
      responsibilities: projection.responsibilities,
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
