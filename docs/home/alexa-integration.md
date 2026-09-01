# Alexa integration

**Status: SCAFFOLDED** (intent → proposal mapper). **Execute: NOT SUPPORTED.**

Alexa is treated as a voice / intent adapter, not a device registry. Utterances map to `HomeActionRequest` or routine evaluation proposals that still require MapAble authority.

P0 provides intent fixtures (e.g. evaluate going out, propose turn on) and `MAPABLE_HOME_ENV_ALEXA_ENABLED`.

**PROPOSED:** MCS / skill hosting. **NOT SUPPORTED:** live Alexa account linking or device actuation.

## Account linking

See [alexa-account-linking.md](./alexa-account-linking.md).

**Alexa account linking:** IMPLEMENTED / NOT VERIFIED (foundation only).  
**Alexa real-device control:** NOT IMPLEMENTED.  
**Participant-authority enforcement for Alexa proposals:** covered by unit tests for the authority gate; end-to-end skill traffic NOT VERIFIED.

Do not claim “Works with Alexa” until Amazon certification permits it.

