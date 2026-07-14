# Mobile release

EAS profiles in `apps/mobile/eas.json`. Production submission requires explicit human approval.

```mermaid
flowchart TB
  Dev[Development builds] --> Preview[Preview / internal]
  Preview --> Pilot[TestFlight + Play internal]
  Pilot --> Reviews[Privacy security a11y reviews]
  Reviews --> Human[Human release approval]
  Human --> Prod[Production store binaries]
```
