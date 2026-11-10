# MapAble Day — competitor patterns → components

Design reference only. Cite public product pages; **do not copy UI, branding, or copy**.

Visual tokens: `#0C1833`, `#005B7F`, `#F8C51C`. Status = text + icon (never colour alone).

| Vendor pattern | Public reference | MapAble first-increment delivery |
|---|---|---|
| Care Routine Studio (Maslow-inspired) | [Maslow Care](https://www.maslow.care/) | Flag-gated synthetic editor (`MAPABLE_DAY_ROUTINES_DEMO_ENABLED`); no localStorage of real instructions; no unauthenticated QR |
| Shift handover | [ShiftCare](https://shiftcare.com/) | Synthetic worker view only (`MAPABLE_DAY_HANDOVER_DEMO_ENABLED`); granular permission copy; no real plans |
| My Day oversight | [Five Good Friends](https://www.fivegoodfriends.com.au/) | Compact sections: want / arranged / needs confirmation / changed / next action on programmatic panel |
| Cancellation recovery | [Hireup](https://hireup.com.au/) | Port PR #32 dependency + recovery display; reuse recovery libs as **read-only adapters** — no write invokes |
| ArrangementStatus | [Mable](https://mable.com.au/) | Display-domain mapping over existing certainty enums; no enum migration |
| Support Circle | [Jointly](https://www.jointly.com.au/) | Synthetic permissions preview only under Day v2 progressive disclosure |
| Evidence & Updates | CareApp-class apps | Labels for recorded / confirmed / disputed / unverified / authorised share — no family feed |

## Progressive disclosure (under `MAPABLE_DAY_V2_ENABLED`)

1. **Plan** — nearest confirmed + pending from authorised snapshot  
2. **Support** — care / transport summaries  
3. **Changes** — cancelled / disputed / needs confirmation from snapshot facts only  
4. **Sharing** — synthetic permission copy; never grants live share  

Do not stuff seven competitor panels into the first viewport.
