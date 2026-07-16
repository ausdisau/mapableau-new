# Adapters (Priority 2)

Typed interfaces with **labelled mocks** in `lib/access-intelligence/adapters/`.

| Adapter | Purpose | Live? |
|---------|---------|-------|
| TransportDataAdapter | Services, pathways, disruptions | Mock |
| IndoorNavigationAdapter | Indoor nodes / positioning | Mock |
| BuildingModelImporter | Neutral graph / IFC-adjacent import | Mock |
| MessagingAdapter | Approved verification delivery | Mock |
| BuildingManagementAdapter | Read state; propose changes only | Mock (+ optional HTTP live via `live/`) |
| DeveloperApiAdapter | Public decision envelope; no passport | Mock |

Live status cascade (separate): `lib/access-intelligence/live/` — HTTP BMS when `ACCESS_INTELLIGENCE_BMS_URL` set.
