# RC1 golden paths

Golden paths use synthetic IDs only and validate contracts without real participant data.

| Path                           | Fully executable | Blocker                                             |
| ------------------------------ | ---------------- | --------------------------------------------------- |
| A — Participant onboarding     | No               | Wave 20 constitutional invariants absent            |
| B — Provider worker onboarding | No               | Waves 14-16 / Pack A absent                         |
| C — Care service               | No               | Wave 16 workforce allocation absent                 |
| D — Transport service          | No               | Wave 20 invariants and approved live routing absent |
| E — Disruption recovery        | No               | Wave 20 constitutional invariants absent            |
| F — Access journey             | No               | Wave 20 invariants and live AccessOps feeds absent  |
| G — Complaint and appeal       | No               | Wave 20 constitutional invariants absent            |
| H — Data rights and exit       | No               | Wave 20 constitutional invariants absent            |

Command: `pnpm test:golden-paths`.

Matrix script: `pnpm exec tsx scripts/rc/run-golden-paths.ts`.
