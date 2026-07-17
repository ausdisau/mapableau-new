import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-ai-tenant-scope",
    "scan AURA executions for missing Organisation.id where the participant is tenant-scoped",
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
