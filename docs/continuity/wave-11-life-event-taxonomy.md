# Wave 11 — Life event taxonomy

`LifeEventKind` values:

| Kind | Meaning |
|---|---|
| `address_change` | Participant home address change (declared by the participant or a delegate). |
| `employment_change` | Participant starts, changes, or leaves employment. |
| `household_change` | Change in the participant's household (new carer, moved-in family, etc). |
| `hospital_admission` | Participant admitted to hospital. |
| `hospital_discharge` | Participant discharged from hospital. |
| `bereavement` | Death of a person the participant relied on. |
| `legal_status_change` | Change to guardianship, delegate, or legal authority. |
| `representative_change` | New advocate / plan manager / support coordinator. |
| `travel_planned` | Participant will travel and may need services paused. |
| `service_pause_planned` | Participant plans to pause a specific service. |
| `provider_wind_down` | Provider notifies of wind-down affecting a participant. |
| `provider_closure` | Provider closure event. |
| `disaster_impact` | Participant affected by a disaster (fire, flood, evacuation). |
| `other` | Anything else — a coordinator should re-categorise where possible. |

Life events are ALWAYS declared by a human. `LifeEventSource="aura_suggestion"` sets `aiSuggested=true` and always remains `draft` until a human confirms.
