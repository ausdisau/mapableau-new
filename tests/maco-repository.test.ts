import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  listEvidenceForIndicator,
  recordEvidence,
  upsertIndicator,
  upsertResearchSource,
  upsertTheory,
} from "@/lib/ai/research/maco/repository";

const enabled = Boolean(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const theoryKey = `maco-theory-${suffix}`;
const indicatorKey = `maco-indicator-${suffix}`;
const sourceId = `maco-source-${suffix}`;
const doi = `10.9999/mapable.${suffix}`;

describe.skipIf(!enabled)("MACO research repository", () => {
  let prisma: typeof import("@/lib/prisma").prisma;

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.macoConsciousnessEvidence.deleteMany({
      where: { sourceId },
    });
    await prisma.macoResearchSource.deleteMany({
      where: { OR: [{ id: sourceId }, { doi }] },
    });
    await prisma.macoConsciousnessIndicator.deleteMany({
      where: { indicatorKey },
    });
    await prisma.macoConsciousnessTheory.deleteMany({
      where: { theoryKey },
    });
  });

  it("stores opposite evidence directions for the same indicator without overwriting history", async () => {
    await upsertResearchSource({
      id: sourceId,
      title: "Synthetic MACO evidence source",
      doi,
      publicationStatus: "peer_reviewed",
    });

    const baseEvidence = {
      sourceId,
      indicatorIds: [indicatorKey],
      publicationStatus: "peer_reviewed" as const,
      methodSummary: "Synthetic controlled comparison",
      alternativeExplanations: [],
      replicationStatus: "unknown" as const,
      evidenceStrength: "moderate" as const,
      assessedAt: new Date().toISOString(),
    };

    await recordEvidence({
      ...baseEvidence,
      id: `support-${suffix}`,
      direction: "supports",
    });
    await recordEvidence({
      ...baseEvidence,
      id: `oppose-${suffix}`,
      direction: "opposes",
    });

    const rows = await listEvidenceForIndicator(indicatorKey);
    expect(rows.map((row) => row.direction).sort()).toEqual([
      "opposes",
      "supports",
    ]);
  });

  it("deduplicates research sources by DOI even when caller IDs differ", async () => {
    const first = await upsertResearchSource({
      id: sourceId,
      title: "Synthetic MACO source v1",
      doi,
      publicationStatus: "peer_reviewed",
    });
    const second = await upsertResearchSource({
      id: `${sourceId}-alias`,
      title: "Synthetic MACO source v2",
      doi,
      publicationStatus: "peer_reviewed",
    });

    expect(second.id).toBe(first.id);
    expect(await prisma.macoResearchSource.count({ where: { doi } })).toBe(1);
  });

  it("retains prior theory and indicator versions", async () => {
    await upsertTheory({
      id: theoryKey,
      name: "Synthetic theory",
      theoryFamily: "other",
      summary: "Version one",
      computationalApplicability: "unknown",
      sourceIds: [sourceId],
      version: 1,
    });
    await upsertTheory({
      id: theoryKey,
      name: "Synthetic theory",
      theoryFamily: "other",
      summary: "Version two",
      computationalApplicability: "contested",
      sourceIds: [sourceId],
      version: 2,
    });

    await upsertIndicator({
      id: indicatorKey,
      theoryIds: [theoryKey],
      name: "Synthetic indicator",
      operationalDefinition: "Version one",
      evidenceRequired: ["architecture"],
      knownConfounds: ["mimicry"],
      status: "active",
      version: 1,
    });
    await upsertIndicator({
      id: indicatorKey,
      theoryIds: [theoryKey],
      name: "Synthetic indicator",
      operationalDefinition: "Version two",
      evidenceRequired: ["architecture", "experiment"],
      knownConfounds: ["mimicry"],
      status: "contested",
      version: 2,
    });

    expect(
      await prisma.macoConsciousnessTheory.count({ where: { theoryKey } }),
    ).toBe(2);
    expect(
      await prisma.macoConsciousnessIndicator.count({
        where: { indicatorKey },
      }),
    ).toBe(2);
  });
});
