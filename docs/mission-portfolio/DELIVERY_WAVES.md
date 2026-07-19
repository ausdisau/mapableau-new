# Mission Portfolio delivery waves

Maximum **three** unmerged product PRs. Security/ops PRs (e.g. secret-scan gate) are reviewed independently and must not be used as feature stack bases.

## Wave 0 — Safety and train gate

| Item | Status (2026-07-17) |
| --- | --- |
| Scrub credential text from PR bodies #344/#136/#22 | Done |
| Expand secret-pattern CI | PR #345 |
| Human credential rotation + session invalidation | **Blocked — human** |
| www TLS / canonical host | **Blocked — human** (#344 ops) |
| Leadership train #330 → #341 → #346 | **Merged to main** |

## Waves 1–24 (product)

| Wave | Focus |
| --- | --- |
| 1 | Mission Portfolio registry (this change set) |
| 2 | Shared mission dependency projection |
| 3 | Service Standard + Service Diff |
| 4 | Cross-provider Handoff |
| 5 | AT Continuity |
| 6 | Health Navigator |
| 7 | Home and Living |
| 8 | Transitions |
| 9 | Foundational Supports |
| 10 | Events and Tourism |
| 11 | Emergency Ready |
| 12 | Justice and Advocacy |
| 13 | Enterprise |
| 14 | Age at Home |
| 15 | Human Navigator Network |
| 16 | Funding Navigator |
| 17 | Outcome Reporting Studio |
| 18 | Personal Access Data Wallet |
| 19 | Reliability Statements |
| 20 | Cross-Vertical Companion |
| 21 | Replay Lab expansion |
| 22 | Controlled pilot portfolio |
| 23 | Commercial packaging |
| 24 | Production-readiness evaluation |

## First product train after Wave 0

1. `chore(missions): establish MapAble Mission Portfolio registry` — `cursor/mission-portfolio-registry-fd3d`
2. `feat(missions): shared mission dependency projection` — `cursor/shared-mission-projection-fd3d`
3. `feat(participant): service standard and change diff` — `cursor/participant-service-standard-fd3d`

Do not begin AT Continuity until these three foundations are accepted.
