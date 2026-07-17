# Wave 11 — Continuity communications

Communications are logged as `ContinuityCommunicationAttempt`. Every attempt requires channel consent; without consent the attempt is recorded as `suppressed_no_consent` and NOTHING is sent.

Supported channels: `in_app`, `sms`, `email`, `phone_human`, `postal_human`, `interpreter_required`.

`interpreter_required` is a flag that surfaces to the coordinator UI when the participant has `interpreterRequired=true` on their profile — communications must not proceed without a human interpreter.
