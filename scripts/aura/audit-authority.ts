import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-authority",
    "scan AuraAuthorityEnvelope rows for empty scopePermissions, empty allowedActionSlugs, missing tenant scope, and expired-still-active status",
    {
      disclaimers: [
        "AURA is not sentient.",
        "AURA cannot approve invoices, claims, or payments.",
        "All participant-data egress goes via discloseParticipantData.",
      ],
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
