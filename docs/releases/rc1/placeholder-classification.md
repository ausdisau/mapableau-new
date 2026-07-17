# RC1 placeholder classification

| Placeholder                    | Classification   | Release treatment                                               |
| ------------------------------ | ---------------- | --------------------------------------------------------------- |
| NDIA provider adapter stub     | sandbox-only     | Mock/sandbox only; no real NDIA submission.                     |
| Demo access routes             | sandbox-only     | Synthetic preview data only.                                    |
| Partner webhook scaffolding    | interface-stable | DTO/signature contract exists; production delivery is disabled. |
| AccessOps status subscriptions | disabled         | `ACCESSOPS_STATUS_SUBSCRIPTIONS_ENABLED=false`.                 |
| Outdoor routing providers      | disabled         | `ACCESSOPS_OUTDOOR_PROVIDERS_ENABLED=false`.                    |
| AccessOps external feeds       | disabled         | `ACCESSOPS_EXTERNAL_FEEDS_ENABLED=false`.                       |

Source of truth: `lib/release-candidate/placeholders/classifier.ts`.
