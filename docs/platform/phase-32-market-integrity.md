# Phase 32 — Market integrity

- Organic ranking (`lib/market-integrity/ranking-governance.ts`) never
 accepts a paid boost.
- Sponsored content lives in labelled slots outside the organic list and must
 carry the word "Sponsored" and a >= 20-char disclosure.

Participants must always be able to distinguish paid placement from organic
matches. Automated tests for this live in `tests/market-integrity/` (Wave 8
adds the initial assertions).
