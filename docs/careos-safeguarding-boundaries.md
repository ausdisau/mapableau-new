# CareOS safeguarding boundaries

## Principle

Safeguarding decisions are **human-only**. CareOS may assist coordination; it must not determine abuse, neglect, or risk outcomes.

## Permitted

- Route incidents to existing incident/complaint services
- Flag that a human safeguarding review may be needed (non-diagnostic language)
- Preserve participant-stated concerns in audit-safe form
- Support coordinator escalation workflows with explicit consent

## Prohibited

- Safeguarding findings or risk scores
- Automatic reporting without human review (except where statutory services already own the workflow)
- Sharing safeguarding detail in notification previews or push text
- Using safeguarding history to block services without human decision

## Integration

- Incident service: `lib/incidents/incident-service.ts` remains canonical
- Admin safeguarding surfaces: `/admin/safeguarding`
- Emergency access: human admin approval only (`docs/careos/identity-and-authority.md`)
- Unified Care & Support Guardian (`lib/ai/platform/guardian/`) may route to human review / incident / complaint paths; it must not decide reportability or substantiate allegations. See `docs/ai-platform/guardian/SAFEGUARDING_BOUNDARY.md`.

## Worker cancellation and continuity

Worker cancellation recovery never silently substitutes a worker. Participant confirmation is required before assignment changes that affect safeguarding-sensitive supports.

## Notification hygiene

Safeguarding-related notifications use redacted previews; full detail only in authenticated in-app views after authority check.
