import { runAudit, scanFilesForPattern } from "./_shared";

async function main() {
  await runAudit(
    "continuity:audit-consent",
    "Confirm all continuity communications go through consented channels.",
    { checks: ["consent_bypass_in_communications"] },
    async () => {
      const hits = scanFilesForPattern({
        roots: ["lib/continuity/communications"],
        extensions: [".ts"],
        pattern: /(sendmail|nodemailer|twilio|smsGateway)\.send|process\.env\.[A-Z_]+_KEY/i,
      });
      return { findings: hits, pass: hits.length === 0 };
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
