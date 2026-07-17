import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:audit-bypasses",
    "scan for AURA code paths that call external endpoints outside the tool registry or MCP gateway",
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
