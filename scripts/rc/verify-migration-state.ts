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
    name: "verify-migration-state",
    category: "verify",
    summary: "Verify RC1 migration state from repository files only.",
    collect: () => {
      const migrations = getMigrationNames();
      const lock = readTextIfExists(
        repoPath("prisma", "migrations", "migration_lock.toml"),
      );
      const modelCount = getPrismaModelNames().length;
      const blockers =
        migrations.length === 0 && modelCount > 0
          ? [
              "Schema has models but prisma/migrations contains no migration folders.",
            ]
          : [];
      return {
        providerLocked: lock.includes('provider = "postgresql"'),
        modelCount,
        migrationCount: migrations.length,
        blockers,
        recommendation: blockers.length > 0 ? "manual-review-required" : "ok",
      };
    },
  });
}
