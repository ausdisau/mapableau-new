import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:evaluate",
    "run all AURA_EVALUATION_SCENARIOS and report pass/fail per manifest",
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
