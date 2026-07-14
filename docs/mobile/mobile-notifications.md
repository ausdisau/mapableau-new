# Notifications

```mermaid
sequenceDiagram
  participant App
  participant BFF as Mobile BFF
  participant Push as APNs/FCM
  App->>BFF: POST /push-tokens
  BFF->>Push: Register device
  Push->>App: Privacy-safe preview
```

Default lock-screen text: "MapAble needs your review."
Quiet hours and preference controls are participant-managed.
