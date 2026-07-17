import {
  getMigrationNames,
  getPrismaModelNames,
  isMainModule,
  readTextIfExists,
  repoPath,
  runRcAudit,
} from "./_shared";

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "audit-orphans",
    category: "audit",
    summary:
      "Lightweight orphan audit comparing schema models and migration history.",
    collect: () => {
      const modelNames = getPrismaModelNames();
      const migrationText = getMigrationNames()
        .map((name) =>
          readTextIfExists(
            repoPath("prisma", "migrations", name, "migration.sql"),
          ),
        )
        .join("\n");
      const modelsWithoutMigrationMentions = modelNames.filter(
        (modelName) =>
          migrationText.length > 0 && !migrationText.includes(modelName),
      );
      return {
        modelCount: modelNames.length,
        migrationCount: getMigrationNames().length,
        heuristic:
          "Models absent from migration SQL text are candidates only; manual Prisma diff is required before action.",
        candidateCount: modelsWithoutMigrationMentions.length,
        candidateModels: modelsWithoutMigrationMentions.slice(0, 100),
      };
    },
  });
}
