# MapAble ecosystem — Cursor prompt pack

Structured implementation specs for **14 vertical modules**, aligned with this repo (`app/`, `lib/`, `prisma/`, NextAuth + Prisma).

## How to use

1. Read [00-shared-architecture.md](./00-shared-architecture.md).
2. Copy [00-universal-meta-prompt.md](./00-universal-meta-prompt.md) into Cursor and set `{{VERTICAL}}` / `{{SLUG}}`.
3. Open the vertical file below and paste its **Cursor instruction** section into the same chat.
4. Implement on a `cursor/<slug>-mvp-ce11` branch; open a draft PR to `main`.

## Vertical index

| # | Module | Spec file | Suggested branch |
|---|--------|-----------|------------------|
| 1 | MapAble Emergency | [01-emergency.md](./01-emergency.md) | `cursor/emergency-mvp-ce11` |
| 2 | MapAble News | [02-news.md](./02-news.md) | `cursor/news-mvp-ce11` |
| 3 | MapAble Independence | [03-independence.md](./03-independence.md) | `cursor/independence-mvp-ce11` |
| 4 | MapAble Cloud | [04-cloud.md](./04-cloud.md) | `cursor/cloud-mvp-ce11` |
| 5 | MapAble Provider Toolkit | [05-provider-toolkit.md](./05-provider-toolkit.md) | `cursor/provider-toolkit-mvp-ce11` |
| 6 | MapAble Academy / DisAcademy | [06-academy.md](./06-academy.md) | `cursor/academy-mvp-ce11` |
| 7 | MapAble Voice Assistant | [07-voice-assistant.md](./07-voice-assistant.md) | `cursor/voice-mvp-ce11` |
| 8 | MapAble Research / Insights | [08-insights.md](./08-insights.md) | `cursor/insights-mvp-ce11` |
| 9 | MapAble Community | [09-community.md](./09-community.md) | `cursor/community-mvp-ce11` |
| 10 | MapAble Grants | [10-grants.md](./10-grants.md) | `cursor/grants-mvp-ce11` |
| 11 | MapAble Housing | [11-housing.md](./11-housing.md) | `cursor/housing-mvp-ce11` |
| 12 | MapAble Events | [12-events.md](./12-events.md) | `cursor/events-mvp-ce11` |
| 13 | MapAble Volunteers | [13-volunteers.md](./13-volunteers.md) | `cursor/volunteers-mvp-ce11` |
| 14 | MapAble Advocacy | [14-advocacy.md](./14-advocacy.md) | `cursor/advocacy-mvp-ce11` |

## Recommended build order

Aligns with ecosystem “bones” after Core + operational spine (Care, Transport, Employment, Foods, Moves):

| Priority | Module | Why |
|----------|--------|-----|
| **1** | Independence | Daily living + goals; links Care/Foods/Transport |
| **2** | Emergency | Safety net + escalation |
| **3** | Provider Toolkit | Small provider ops without full Cloud |
| **4** | Academy | Workforce training + compliance |
| **5** | Housing | Accessible homes + SDA/SIL |
| 6 | Events | Community participation + transport hooks |
| 7 | Community | Peer support with moderation |
| 8 | Grants | Funding guidance |
| 9 | News | Policy literacy |
| 10 | Voice | Accessible intake (confirm-before-act) |
| 11 | Insights | De-identified analytics |
| 12 | Volunteers | Mapping / audits |
| 13 | Advocacy | Systemic change |
| 14 | Cloud | Full provider SaaS (heaviest) |

## Architecture groups

- **Safety & daily living:** Emergency, Independence, Housing, Foods  
- **Community & advocacy:** Community, Events, Volunteers, Advocacy, News  
- **Provider infrastructure:** Cloud, Provider Toolkit, Academy, Insights  
- **Intelligent access:** Voice, Grants, Lens, Navigate  

## Already in progress (separate PRs)

- Participant dashboard, Provider onboarding  
- Care / Transport / Employment ([PR #38](https://github.com/ausdisau/mapableau-new/pull/38))  
- Foods & Moves ([PR #39](https://github.com/ausdisau/mapableau-new/pull/39))  

## One-shot meta-prompt (all verticals planning only)

```
Using docs/cursor-prompt-pack/, produce a cross-vertical implementation roadmap:
dependencies between modules, shared Prisma enums, new permissions, and migration order.
Do not write application code — planning document only.
```
