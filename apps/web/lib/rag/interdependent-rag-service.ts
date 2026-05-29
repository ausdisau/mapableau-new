import { canRetrieveModule } from "./consent-for-module";
import { resolveModuleClosure } from "./module-graph";
import { PROVIDERS_BY_MODULE } from "./providers/mock-providers";
import type {
  InterdependentRagRequest,
  InterdependentRagResult,
  ModuleId,
  RagChunk,
} from "./types";

export async function retrieveInterdependentModuleRag(
  request: InterdependentRagRequest
): Promise<InterdependentRagResult> {
  const maxModules = request.maxModules ?? 6;
  const maxChunks = request.maxChunks ?? 12;
  const modulesQueried: ModuleId[] = [];
  const allChunks: RagChunk[] = [];

  for (const moduleId of resolveModuleClosure(
    request.originModule,
    maxModules
  )) {
    if (!canRetrieveModule(moduleId, request.grantedScopes)) continue;

    const provider = PROVIDERS_BY_MODULE[moduleId];
    if (!provider) continue;

    modulesQueried.push(moduleId);
    const chunks = await provider.retrieve({
      participantId: request.participantId,
      query: request.query,
      grantedScopes: request.grantedScopes,
    });
    allChunks.push(...chunks);
  }

  const chunks = allChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  return {
    originModule: request.originModule,
    modulesQueried,
    chunks,
  };
}
