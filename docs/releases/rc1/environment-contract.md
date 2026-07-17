# RC1 environment contract

Source: `.env.example`.

Generated inventory: `docs/releases/rc1/inventories/environment-inventory.json`.

## Summary

- Environment keys inventoried: 312.
- RC feature flags matching `ACCESSOPS_`, `WAVE`, `PILOT`, or `PARTICIPATION`: 19.
- AccessOps production feeds, outdoor providers, open data, webhooks, status subscriptions, sensors, and indoor imports default to disabled.
- NDIA provider adapter defaults to mock mode.

## Rule

RC1 must not activate production integrations or infer readiness from feature flags.
