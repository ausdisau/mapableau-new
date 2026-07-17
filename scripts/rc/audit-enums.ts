import {
  isMainModule,
  readTextIfExists,
  repoPath,
  runRcAudit,
} from "./_shared";

if (isMainModule(import.meta.url)) {
  runRcAudit({
    name: "audit-enums",
    category: "audit",
    summary: "Static enum inventory for Prisma schema consolidation.",
    collect: () => {
      const schema = readTextIfExists(repoPath("prisma", "schema.prisma"));
      const enumNames = Array.from(
        schema.matchAll(/^enum\s+([A-Za-z0-9_]+)\s+\{/gm),
        (match) => match[1],
      ).sort();
      return {
        enumCount: enumNames.length,
        enumNames,
      };
    },
  });
}
