import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-queries",
    "Check that continuity queries are tenant + participant scoped, not unscoped.",
    { checks: ["unscoped_findMany"] },
    async () => {
      const hits = scanFilesForPattern({
        roots: ["lib/continuity", "app/api/continuity"],
        extensions: [".ts"],
        // findMany() with no where clause is suspicious. We flag `findMany({})`,
        // `findMany()`, and `findMany({\n})` variants.
        pattern: /\.findMany\(\s*\)|\.findMany\(\s*\{\s*\}\s*\)/i,
      });
      return { findings: hits, pass: hits.length === 0 };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
