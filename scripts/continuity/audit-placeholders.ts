import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-placeholders",
    "Detect executable operational paths that fall back to placeholder addresses or missing dates.",
    { checks: ["placeholder_address_executable_path"] },
    async () => {
      const hits = scanFilesForPattern({
        roots: ["lib", "app"],
        extensions: [".ts"],
        pattern: /['"]Address to be confirmed['"]|['"]TBD['"]|['"]TBA['"]/i,
      });
      // Only flag lines that also appear alongside `status:` or `create` in a
      // small surrounding context (approximate by matching entire line).
      const risky = hits.filter((h) => /create|update|status|preferredDate/i.test(h.snippet));
      return { findings: risky, references: hits, pass: risky.length === 0 };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
