import {
  isMainModule,
  readTextIfExists,
  repoPath,
  runRcAudit,
} from "./_shared";

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "audit-indexes",
    category: "audit",
    summary:
      "Static index and uniqueness inventory for Prisma schema consolidation.",
    collect: () => {
      const schema = readTextIfExists(repoPath("prisma", "schema.prisma"));
      const modelCount = Array.from(
        schema.matchAll(/^model\s+([A-Za-z0-9_]+)\s+\{/gm),
      ).length;
      const compoundIndexCount = Array.from(
        schema.matchAll(/@@index\s*\(/g),
      ).length;
      const compoundUniqueCount = Array.from(
        schema.matchAll(/@@unique\s*\(/g),
      ).length;
      const fieldUniqueCount = Array.from(
        schema.matchAll(/\s@unique\b/g),
      ).length;
      return {
        modelCount,
        compoundIndexCount,
        compoundUniqueCount,
        fieldUniqueCount,
        note: "This is a schema inventory, not a database query-plan analysis.",
      };
    },
  });
}
