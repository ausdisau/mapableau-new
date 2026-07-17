import {
  isMainModule,
  readTextIfExists,
  repoPath,
  runRcAudit,
} from "./_shared";

interface RequiredFieldCandidate {
  model: string;
  field: string;
  type: string;
}

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "backfill-required-fields",
    category: "backfill",
    summary: "Dry-run planner for required Prisma fields without defaults.",
    collect: (args) => {
      const schema = readTextIfExists(repoPath("prisma", "schema.prisma"));
      const candidates: RequiredFieldCandidate[] = [];
      const modelBlocks = schema.matchAll(
        /^model\s+([A-Za-z0-9_]+)\s+\{([\s\S]*?)^}/gm,
      );
      for (const block of modelBlocks) {
        const model = block[1];
        const body = block[2];
        for (const line of body.split(/\r?\n/)) {
          const match = line
            .trim()
            .match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)(\[\])?\s*(.*)$/);
          if (!match) continue;
          const [, field, type, isList, attributes] = match;
          const isScalarRequired =
            !isList &&
            !type.endsWith("?") &&
            !attributes.includes("@default") &&
            !attributes.includes("@id") &&
            !attributes.includes("@updatedAt") &&
            !/^[A-Z]/.test(field);
          if (isScalarRequired) {
            candidates.push({ model, field, type });
          }
        }
      }
      return {
        plannedWrites: 0,
        dryRunOnly: true,
        requestedDryRun: args.dryRun,
        candidateCount: candidates.length,
        candidates: candidates.slice(0, 100),
        note: "No database writes are performed by this RC1 planner.",
      };
    },
  });
}
