import fs from "node:fs";
import path from "node:path";

const checklist = [
  ["INCIDENT_ESCALATION", "eng", "Safeguarding incident paths tested with evidence."],
  ["DR_EXERCISE", "ops", "DR exercise with restore proof."],
  ["ONCALL_ESCALATION_TREE", "ops", "Oncall roster and escalation tree published."],
  ["STATUS_COMMS_CHANNEL", "ops", "Status comms channel configured and tested."],
  ["DISPATCH_RUNBOOK", "ops", "Dispatch runbook documented."],
  ["SUPPORT_SLA_PUBLISHED", "product", "Support SLAs published for all audiences."],
  ["PROVIDER_ONBOARDING_RUNBOOK", "ops", "Provider onboarding runbook verified."],
  ["MOBILE_A11Y_TEST", "eng", "Mobile a11y test completed."],
  ["MOBILE_PRIVACY_LABELS", "product", "App store privacy labels reviewed."],
  ["WEB_A11Y_AUDIT", "eng", "Web accessibility audit with remediation plan."],
  ["PRIVACY_POLICY_LIVE", "legal", "Privacy policy live at /privacy."],
  ["TERMS_OF_SERVICE_LIVE", "legal", "Terms live at /terms."],
  ["CONSENT_FLOWS_REVIEWED", "legal", "Consent flows reviewed for NDIS/privacy."],
  ["STRIPE_PRODUCTION_VERIFIED", "eng", "Stripe production keys and webhooks verified."],
  ["PROD_INTEGRATIONS_HEALTHY", "eng", "Critical integrations healthy in production."],
  ["BACKUP_RESTORE_VERIFIED", "ops", "Backup restore test documented."],
  ["OBSERVABILITY_ALERTS", "eng", "Observability and alerting configured."],
  ["LOAD_CAPACITY_REVIEW", "eng", "Load/capacity review for launch traffic."],
  ["SECURITY_CONTROLS_REVIEWED", "eng", "Security frameworks reviewed in admin."],
  ["PEER_MODERATION_READY", "product", "Peer moderation policy and tooling ready."],
  ["PUBLIC_BETA_EXIT_REVIEW", "product", "Beta exit review completed."],
  ["PUBLIC_LAUNCH_GO_NO_GO", "product", "Executive go/no-go recorded."],
];

const dir = path.join(process.cwd(), "docs", "runbooks", "launch");
fs.mkdirSync(dir, { recursive: true });

for (const [code, owner, summary] of checklist) {
  const gapCode = `launch.${code}`;
  const body = `# ${code}

## Owner
${owner}

## Summary
${summary}

## Acceptance criteria
- [ ] Definition of done is testable and signed off by owner role
- [ ] Evidence attached in admin launch readiness (document ID, ticket, or screenshot link in notes)

## Evidence required
- Link or document ID recorded on the checklist row in \`/admin/launch-readiness\`
- Related platform gap \`${gapCode}\` shows met when status is ready or waived

## Related links
- [Launch checklist](/admin/launch-readiness)
- [Platform gaps](/admin/platform-gaps)
- [Full public launch guide](/docs/full-public-launch.md)

## Waive policy
- Waive only with written rationale in notes and explicit product/legal approval for critical items
- Governance items (\`PUBLIC_LAUNCH_GO_NO_GO\`, \`PUBLIC_BETA_EXIT_REVIEW\`) must not be waived without council sign-off
`;

  fs.writeFileSync(path.join(dir, `${code}.md`), body, "utf8");
}

console.log(`Wrote ${checklist.length} runbooks to ${dir}`);
