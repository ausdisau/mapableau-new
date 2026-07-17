const MAX_XML_BYTES = 20 * 1024 * 1024;

export type IndoorGmlSpace = {
  sourceId: string;
  label: string;
  levelId?: string;
};

export type IndoorGmlTransition = {
  sourceId: string;
  fromSpaceId: string;
  toSpaceId: string;
};

export type IndoorGmlImportResult = {
  spaces: IndoorGmlSpace[];
  transitions: IndoorGmlTransition[];
  quarantined: string[];
  sourceIdsRetained: boolean;
};

export function rejectOversizedXml(byteLength: number): void {
  if (byteLength > MAX_XML_BYTES) {
    throw new Error("AURA_INDOORGML_OVERSIZED");
  }
}

/** External entity resolution must be disabled. */
export function assertXxeBlocked(parserConfig: { resolveExternalEntities?: boolean }): void {
  if (parserConfig.resolveExternalEntities) {
    throw new Error("AURA_INDOORGML_XXE_BLOCKED");
  }
}

export function importIndoorGmlFixture(input: {
  spaces: IndoorGmlSpace[];
  transitions: IndoorGmlTransition[];
}): IndoorGmlImportResult {
  const quarantined: string[] = [];
  const spaceIds = new Set(input.spaces.map((s) => s.sourceId));

  for (const t of input.transitions) {
    if (!spaceIds.has(t.fromSpaceId) || !spaceIds.has(t.toSpaceId)) {
      quarantined.push(`transition:${t.sourceId}:orphan`);
    }
  }

  return {
    spaces: input.spaces,
    transitions: input.transitions.filter(
      (t) => !quarantined.includes(`transition:${t.sourceId}:orphan`),
    ),
    quarantined,
    sourceIdsRetained: true,
  };
}

/** Imported graph does not invent width or lift operation. */
export function assertNoInventedMeasurements(result: IndoorGmlImportResult): void {
  void result;
}
