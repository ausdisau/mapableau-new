import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-agent-memory",
    "alias for audit-memory with pack-required naming",
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
