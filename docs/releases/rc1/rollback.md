# RC1 rollback

## Code rollback

- Revert the RC1 commit or move consumers back to the Wave 17 tip.
- Do not run destructive migration cleanup as part of RC1 rollback.

## Data rollback

- RC1 scripts are dry-run/static by default and do not write production data.
- If future RC scripts are run with write capability, record the specific script artifact under `artifacts/release-candidate/` before rollback.

## Integration rollback

- Keep NDIA, AccessOps feeds, outdoor routing, production webhooks, and status subscriptions disabled.
- Do not switch payment or production integration modes as part of RC1 rollback.
