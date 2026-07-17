import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:test-accessibility",
    "exercise plain-language / disclaimer / forbidden-self-description guards",
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
