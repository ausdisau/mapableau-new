# Device adapters

Adapters are the **only** modules that speak to building systems. Agent and UI never import protocol clients directly.

**Code:** `lib/access-intelligence/physical/adapters/` (+ reuse Core `lib/access-intelligence/adapters/` and `live/` for read status).

## Interfaces (conceptual)

```ts
type DeviceAdapter = {
  readonly id: string;
  /** true = labelled mock; never claim live hardware */
  readonly mock: boolean;
  /** true = scaffold present but not wired to a network */
  readonly connected: boolean;
  readState(input: { placeId: string; elementId: string }): Promise<DeviceState>;
  /** Called only by Action Gateway after Safety Kernel allow */
  execute(command: DeviceCommand): Promise<DeviceCommandResult>;
};
```

Supporting types: `DeviceCommand` (typed action + params), `DeviceCommandResult` (`ok` | `rejected` | `timeout` | `not_connected`), capability discovery for Venue Ops.

Read-only live status continues to use Core `LiveStatusAdapter` (`live/types.ts`) — **status is not actuation**.

## Labelled mocks (demo / tests)

| Adapter | Label | Behaviour |
|---------|-------|-----------|
| Mock BMS | `mock: true`, `connected: true` (synthetic) | Returns Harbour Civic fixture states; execute updates in-memory sim only |
| Mock lift | same | Simulates main / western lift availability |
| Mock door / entrance | same | Simulates Entrance B lock/schedule without real locks |
| Mock messaging | Core `MockMessagingAdapter` | Verification delivery mock |

UI and API responses must include `mock: true` / “simulated” copy whenever mocks respond.

## Optional Core HTTP BMS (read)

`ACCESS_INTELLIGENCE_BMS_URL` enables Core `HttpBuildingManagementAdapter` / `live` HTTP for **status**. `proposeEnvironmentChange` remains `executed: false`. Physical Action Gateway must not treat this HTTP adapter as an execute path until hardware roadmap gates pass.

## Future scaffolds — not connected

Placeholders under `adapters/scaffolds/` for documentation and typing only:

| Scaffold | Intent | Status |
|----------|--------|--------|
| BACnet/IP | BMS points for HVAC, some doors | **Not connected** — throws / `not_connected` |
| MQTT | Telemetry topics, command topics | **Not connected** |
| W3C WoT | Thing Descriptions as capability map | **Not connected** |
| ROS 2 | Campus robot / assistive mobility (future) | **Not connected** |

Scaffolds may define message shapes and env var names but must not open sockets in default builds. Enabling a scaffold requires [REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) + live checklist.

## Rules

1. Every adapter exports `mock` and `connected` flags.
2. Gateway checks flags against operating mode before `execute`.
3. Never log full command payloads that embed passport fields.
4. Timeouts surface as `timed_out` on the action state machine.
5. Do not claim “live hardware integrated” in product copy while only mocks/scaffolds exist.

## Related

[ACTION_STATE_MACHINE.md](./ACTION_STATE_MACHINE.md) · [REAL_HARDWARE_ROADMAP.md](./REAL_HARDWARE_ROADMAP.md) · Core [ADAPTERS.md](../access-intelligence/ADAPTERS.md)
