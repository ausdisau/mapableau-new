import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:a2a-conformance",
    "run the A2A conformance suite (peer registration, entitlement, internal-goal mapping)",
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
