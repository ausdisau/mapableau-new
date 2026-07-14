
# Mobile threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Lost device | SecureStore WHEN_UNLOCKED_THIS_DEVICE_ONLY; biometric re-entry; remote session revoke |
| Stolen session | Short-lived access tokens; refresh rotation; logout-all |
| Malicious deep link | Host/scheme allowlist; no token in URLs |
| Push leakage | Privacy-safe previews only |
| Offline DB extraction | Minimal offline set; encrypted store; expiry; logout wipe |
| Token replay | Idempotency keys; server reconciliation |
| Screenshot / clipboard | Sensitive fields avoid clipboard; no broad screenshot block that harms a11y |
| Insecure Wi-Fi | TLS only |
| Malicious document | Type/size validation; server malware handoff |
| Cross-participant cache | Participant-scoped keys; wipe on context switch |
| Analytics leakage | Opt-in telemetry; redaction |
| Background location misuse | Off by default; purpose-bound to active trip |
| Voice spoofing | Confirmation + authority + step-up; no bypass |
