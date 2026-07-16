# Universal Handoff Protocol

**Service:** `lib/continuity-os/handoff.ts`  
**APIs:** `POST /api/recovery/handoffs`, accept/reject routes

States: draft → prepared → participant_review → sent → received → accepted | partially_accepted | rejected | expired | …  

Receipts distinguish sent / delivered / opened / accepted / task acknowledged / task completed / externally verified / participant confirmed.

**Sent ≠ accepted. Accepted ≠ all tasks completed.**
