export type {
  InterdependentRagRequest,
  InterdependentRagResult,
  ModuleId,
  ModuleRagContext,
  ModuleRagProvider,
  RagChunk,
} from "./types";
export {
  MODULE_DEPENDENCIES,
  copilotIntentToModule,
  resolveModuleClosure,
} from "./module-graph";
export {
  canRetrieveModule,
  requiredScopesForModule,
} from "./consent-for-module";
export { retrieveInterdependentModuleRag } from "./interdependent-rag-service";
