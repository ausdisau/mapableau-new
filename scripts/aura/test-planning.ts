import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:test-planning",
    "exercise plan graph validation against fixture DAGs including cycles and unbounded loops",
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
