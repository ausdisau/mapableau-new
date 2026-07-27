import { compileParticipantRequirements } from "../compiler/compile";
import type { ParticipantRequirementSet } from "../compiler/types";
import type { AccessQueryAst, AccessQueryConstraint } from "../query/ast";

function mergeByConcept(
  base: AccessQueryConstraint[],
  extra: AccessQueryConstraint[],
): AccessQueryConstraint[] {
  const map = new Map<string, AccessQueryConstraint>();
  for (const c of base) map.set(c.ontologyConceptId, c);
  for (const c of extra) map.set(c.ontologyConceptId, c);
  return [...map.values()];
}

/**
 * Compile a ParticipantRequirementSet into hard constraints / preferences /
 * exclusions and apply them onto a query AST for door-to-room preflight.
 */
export function applyRequirementSetToQueryAst(
  query: AccessQueryAst,
  requirementSet: ParticipantRequirementSet,
): {
  query: AccessQueryAst;
  hardConstraints: AccessQueryConstraint[];
  requirementSetRef: string;
} {
  const compiled = compileParticipantRequirements(requirementSet);
  const next: AccessQueryAst = {
    ...query,
    require: mergeByConcept(query.require, compiled.hardConstraints),
    prefer: mergeByConcept(query.prefer, compiled.preferences),
    avoid: mergeByConcept(query.avoid, compiled.exclusions),
  };
  return {
    query: next,
    hardConstraints: compiled.hardConstraints,
    requirementSetRef: compiled.requirementSetRef,
  };
}
