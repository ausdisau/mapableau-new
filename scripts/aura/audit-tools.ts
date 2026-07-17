import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-tools",
    "scan AuraToolDefinition rows for prohibited slugs, missing schema, or write-capable tools without consent gate",
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
