import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-automation-events",
    "inspect audit stream for AURA-emitted events and check pinning of agent/prompt/model/policy/tool versions",
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
