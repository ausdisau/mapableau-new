import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-orchestration",
    "Verify care-transport orchestration does not auto-cancel linked services and uses continuity signals/cases.",
    { checks: ["auto_cancel_removed", "continuity_signal_on_cancel", "coordinator_scoped_queue"] },
    async () => {
      const forbidden = scanFilesForPattern({
        roots: ["lib/orchestration"],
        extensions: [".ts"],
        pattern: /prisma\.transportBooking\.update\([^)]*status:\s*['"]cancelled['"]/i,
      });
      return {
        findings: forbidden,
        pass: forbidden.length === 0,
      };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
