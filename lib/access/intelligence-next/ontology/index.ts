export type {
  AccessOntologyConcept,
  AccessOntologyVersion,
  OntologyDataType,
  OntologyDomain,
  PersonalFitBehaviour,
} from "./types";
export { ACCESS_ONTOLOGY_V1, ONTOLOGY_CONCEPTS_V1 } from "./seed-v1";
export {
  ACCESS_ONTOLOGY_V2,
  ONTOLOGY_CONCEPTS_V2,
  ONTOLOGY_CONCEPT_ALIASES_V1_TO_V2,
  getOntologyConceptV2,
  listAccessDomainsInOntology,
  resolveOntologyConceptId,
} from "./seed-v2";
export { NPTM_ONTOLOGY_CONCEPTS, getNptmOntologyConcept } from "./nptm-extension";

import { ONTOLOGY_CONCEPTS_V1 } from "./seed-v1";
import {
  ACCESS_ONTOLOGY_V2,
  ONTOLOGY_CONCEPTS_V2,
  getOntologyConceptV2,
} from "./seed-v2";
import {
  NPTM_ONTOLOGY_CONCEPTS,
  getNptmOntologyConcept,
} from "./nptm-extension";
import type { AccessOntologyConcept } from "./types";

const nptmOverrideIds = new Set(NPTM_ONTOLOGY_CONCEPTS.map((item) => item.id));

/**
 * Canonical ontology for Access as Infrastructure (v2 plus narrowly scoped,
 * reviewed source-driven concepts). Source extensions may override wording for
 * an existing concept only when that prevents a false accessibility claim.
 */
export const ACCESS_ONTOLOGY_CURRENT = {
  ...ACCESS_ONTOLOGY_V2,
  concepts: [
    ...ONTOLOGY_CONCEPTS_V2.filter((item) => !nptmOverrideIds.has(item.id)),
    ...NPTM_ONTOLOGY_CONCEPTS,
  ],
};

/** Resolve current v2/source-extension concept, then legacy v1 fallback. */
export function getOntologyConcept(
  id: string,
): AccessOntologyConcept | undefined {
  return (
    getNptmOntologyConcept(id) ??
    getOntologyConceptV2(id) ??
    ONTOLOGY_CONCEPTS_V1.find((item) => item.id === id)
  );
}
