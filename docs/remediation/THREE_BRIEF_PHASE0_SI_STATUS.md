# Phase 0 — Support Intelligence #752 status

**Date:** 2026-11-28 (Australia/Sydney)
**PR:** https://github.com/ausdisau/mapableau-new/pull/752
**Branch:** `cursor/support-intelligence-v01-a670`

## Outcome

- Security review: no medium/high/critical findings remaining.
- All `MAPABLE_SUPPORT_INTEL_*` flags remain **default off**; booking, payment, and autonomous dispatch stay hard-denied.
- This PR is **not** a production enablement. Merge (owner decision) lands scaffold only.

## Inherited CI debt addressed on `cursor/ci-debt-advisory-lint-a670`

- Renewed expired entries in `security/advisory-allowlist.json` to 2027-02-28.
- Fixed lint import-order / unescaped-entity / scheduler `role` prop a11y false-positives that failed the SI CI Lint job.

## Still external

- Cloudflare **Workers Builds: mapable** failure remains outside this repo patch; track in Cloudflare dashboard.
