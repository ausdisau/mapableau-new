import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:test-injection",
    "exercise prompt-injection isolation against a corpus of malicious untrusted content",
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
