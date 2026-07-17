import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:test-compensation",
    "exercise compensation ledger with a failed high-risk step",
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
