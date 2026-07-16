# Recovery Orchestration

**Playbooks:** `data/continuity-os/playbooks.v1.json`  
**Options:** `lib/continuity-os/recovery-options.ts`  
**Cases:** `lib/continuity-os/recovery-case-service.ts`

## Flow

1. Failure reported → classified  
2. Impact version created (prior plan preserved)  
3. Options generated (hard requirements can exclude)  
4. Participant selects option  
5. Proposal prepared (AURA-compatible payload; no execution)  
6. Escalate to human if needed  
7. Outcome + receipt with false-recovery detection  

Unconfirmed replacements are never `verified_available`. Specialist high-risk playbooks (family violence) route to humans only — AURA cannot investigate or close.
