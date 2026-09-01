# Google Home native integration

**Status: SCAFFOLDED** (mappers + fixtures). **Execute: NOT SUPPORTED.**

Google Home APIs for structure/device control are native Android / iOS surfaces. Expo Go cannot host them; a development build / native module would be required later.

P0 provides:

- Trait → capability mapper fixtures (`OnOff` → `TURN_ON`, etc.)
- `GoogleHomeBridge` interface stub
- Flag `MAPABLE_HOME_ENV_GOOGLE_ENABLED` (discovery empty when off)

**PROPOSED:** companion development-build bridge. **NOT SUPPORTED:** account OAuth, live device control, web-as-controller.
