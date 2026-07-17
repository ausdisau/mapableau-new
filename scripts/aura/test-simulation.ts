import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:test-simulation",
    "exercise simulator to prove externalWrites === 0 for representative plans",
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
