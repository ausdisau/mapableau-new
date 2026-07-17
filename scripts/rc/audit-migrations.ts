import {
  getMigrationNames,
  getPrismaModelNames,
  isMainModule,
  runRcAudit,
} from "./_shared";

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "audit-migrations",
    category: "audit",
    summary: "Static migration audit for RC1 consolidation.",
    collect: () => {
      const migrations = getMigrationNames();
      return {
        prismaModelCount: getPrismaModelNames().length,
        migrationCount: migrations.length,
        migrations,
        blockers:
          migrations.length === 0
            ? ["No migration folders are present under prisma/migrations."]
            : [],
      };
    },
  });
}
