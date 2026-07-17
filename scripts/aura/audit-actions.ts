import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-actions",
    "scan AuraActionDefinition rows for missing risk tier, undeclared consent requirements, or prohibited actions not tagged prohibited",
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
