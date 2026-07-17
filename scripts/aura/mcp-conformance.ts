import { runAudit } from "./_shared";

async function main() {
  await runAudit(
    "aura:mcp-conformance",
    "run the MCP conformance suite (discovery without participant data, version pin, allowlist)",
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
