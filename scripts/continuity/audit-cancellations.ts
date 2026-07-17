import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-cancellations",
    "Scan for any code path that auto-cascades a cancellation across linked services.",
    { checks: ["direct_cancel_propagation"] },
    async () => {
      // Look for patterns that update *both* care and transport status in the
      // same function.
      const hits = scanFilesForPattern({
        roots: ["lib", "app"],
        extensions: [".ts"],
        pattern: /careShift\.[\s\S]*status:\s*['"]cancelled['"][\s\S]*transportBooking\.update|transportBooking\.[\s\S]*status:\s*['"]cancelled['"][\s\S]*careShift\.update/i,
        ignore: [/node_modules/],
      });
      return { findings: hits, pass: hits.length === 0 };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
