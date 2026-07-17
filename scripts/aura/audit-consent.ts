import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-consent",
    "scan for AURA planned actions that reference actions requiring consent without a matching consent-v2 evaluation record",
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
