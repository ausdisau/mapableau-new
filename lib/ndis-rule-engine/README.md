# NDIS rule engine (MapAble)

This module provides **guidance flags** for service requests, invoice categories, and provider eligibility checks.

**This is not legal or funding advice.** MapAble does not make final NDIS funding decisions. Human review is required for flagged outcomes.

## Usage

```ts
import { evaluateNdisRules } from "@/lib/ndis-rule-engine/evaluate";
import { defaultNdisRules } from "@/lib/ndis-rule-engine/rules";

const result = evaluateNdisRules(context, defaultNdisRules);
// result.outcome: allowed | reviewRequired | blocked
```

Configuration samples live in `data/sample-rules.json`. Rules are evaluated in code via `rules.ts` — keep UI free of hardcoded rule logic.

## Review before production claims

- NDIS line item suggestions
- Provider registration verification messaging
- Public copy on demo flows
