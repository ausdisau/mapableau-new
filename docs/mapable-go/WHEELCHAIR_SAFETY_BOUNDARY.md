# MapAble Go — Wheelchair Safety Boundary

**Claim state:** IMPLEMENTED_NOT_VERIFIED (structural tests in CI)

This boundary is **immutable**.

## Allowed

```
wheelchair controller / HID / switch
  → local MapAble input bridge (not on Vercel)
  → NavigateAction (UI only)
  → MapAble Go
```

## Prohibited

```
MapAble Go → MCP → wheelchair controller → movement
```

MCP and Go action enums must **never** expose:

- driveForward, driveBackward, turnLeft, turnRight
- setDriveAxis, setSpeed, setAcceleration
- releaseBrake, changeDriveProfile, enableExternalDriveControl
- moveSeat, tiltSeat, reclineSeat, elevateSeat, stand
- modifyFirmware

## NavigateAction vocabulary (UI only)

NEXT, PREVIOUS, LEFT, RIGHT, SELECT, BACK, OPEN_MENU, REPEAT_INSTRUCTION, WHERE_AM_I, REROUTE, REPORT_BARRIER, REQUEST_ASSISTANCE

No movement vocabulary.

## Enforcement

- `scripts/ci/check-mapable-go-security.ts` fails if prohibited terms appear in Go/Navigate MCP tool schemas or action enums
- `MAPABLE_ACCESS_PHYSICAL_ACTIONS_ENABLED` must remain false

## Claim honesty

MapAble Go is **not** wheelchair-controller certified, medically certified, or navigation safety certified.
