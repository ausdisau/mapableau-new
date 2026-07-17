# Sensor registry

Sensors observe; they never actuate.

## Rules

- Sensors do not identify participants.
- Facial recognition and biometric inference are prohibited.
- Sensor health is separate from asset state.
- Missing heartbeat → sensor unknown.
- Compromised sensors can be suspended.
- Device secrets are never exposed.
- `isActuationAllowed()` is always false.
