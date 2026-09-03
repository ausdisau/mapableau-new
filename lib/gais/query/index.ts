export {
  GAIS_MAX_RADIUS_METRES,
  GAIS_QUERY_DEFAULT_LIMIT,
  GAIS_QUERY_OBJECTIVES,
  GAIS_QUERY_SCOPES,
  type GaisQueryObjective,
  type GaisQueryScope,
} from "./constants";
export {
  gaisQueryEvidenceRequirementsSchema,
  gaisQueryLocationSchema,
  gaisStructuredQuerySchema,
  type GaisStructuredQuery,
} from "./request-schema";
export { haversineMetres, resolveQueryBounds, type GeoValidationResult } from "./geo";
export {
  compileGaisQueryToAccessQueryAst,
  validateGaisQueryAst,
} from "./compile-ast";
export {
  classifyFeatureScope,
  filterFeatureByQuery,
  groupResultsByScope,
  hasUnknownAccessibilityData,
  sortResultsDeterministically,
  type GaisQueryResultItem,
} from "./classify";
export {
  executeGaisStructuredQuery,
  type GaisQueryDependencies,
  type GaisQueryExecutionResult,
} from "./execute";
