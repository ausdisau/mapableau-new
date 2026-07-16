import { HARBOUR_PLACE_ID } from "../../living/harbour-civic";
import type { DeviceCapability, DeviceState } from "../schemas";

const FICTIONAL =
  "Harbour Civic Centre physical capabilities are fictional demonstration controls.";

export type HarbourCapabilityContext = {
  mainLiftOutage?: boolean;
  doorEntBFault?: boolean;
  emergencyActive?: boolean;
  devices?: DeviceState[];
};

function deviceById(
  devices: DeviceState[] | undefined,
  deviceId: string,
): DeviceState | undefined {
  return devices?.find((d) => d.deviceId === deviceId);
}

/**
 * DeviceCapability[] for Harbour fictional twin.
 * Call sites should pass simulator state so outages disable capabilities.
 */
export function listHarbourCapabilities(
  state?: HarbourCapabilityContext,
): DeviceCapability[] {
  const mainOutage =
    state?.mainLiftOutage === true ||
    deviceById(state?.devices, "dev-lift-main")?.condition === "outage";
  const doorFault =
    state?.doorEntBFault === true ||
    deviceById(state?.devices, "dev-door-ent-b")?.condition === "fault";

  const caps: DeviceCapability[] = [
    {
      id: "cap-lift-west-call",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-lift-west",
      actionType: "call_lift",
      kind: "call_lift",
      label: "Call western lift",
      description:
        "Request the fictional western lift cabin to the visitor's floor.",
      risk: "low_risk_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 20_000,
      postconditions: ["cabin_called"],
    },
    {
      id: "cap-lift-main-call",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-lift-main",
      actionType: "call_lift",
      kind: "call_lift",
      label: "Call main lift",
      description: "Request the fictional main lift cabin.",
      risk: "low_risk_actuation",
      enabled: !mainOutage,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      disabledReason: mainOutage
        ? "Main lift outage active (simulated)."
        : undefined,
      timeoutMs: 20_000,
      postconditions: ["cabin_called"],
    },
    {
      id: "cap-door-ent-b-open",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-door-ent-b",
      actionType: "open_authorised_door",
      kind: "open_authorised_door",
      label: "Open Entrance B (authorised)",
      description:
        "Pulse-open the fictional Entrance B automatic door with user and venue approval.",
      risk: "low_risk_actuation",
      enabled: !doorFault,
      requireUserApproval: true,
      requireVenueApproval: true,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      disabledReason: doorFault
        ? "Entrance B door fault (simulated)."
        : undefined,
      timeoutMs: 10_000,
      postconditions: ["door_open_pulse"],
    },
    {
      id: "cap-room-312-captions",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-room-312",
      actionType: "enable_captions",
      kind: "set_room_accessibility",
      label: "Enable captions in Room 3.12",
      description: "Turn on fictional room captions display.",
      risk: "low_risk_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 5_000,
      postconditions: ["enable_captions"],
    },
    {
      id: "cap-room-312-large-print",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-room-312",
      actionType: "enable_large_print",
      kind: "set_room_accessibility",
      label: "Enable large print in Room 3.12",
      description: "Switch fictional room UI to large print.",
      risk: "low_risk_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 5_000,
      postconditions: ["enable_large_print"],
    },
    {
      id: "cap-room-312-visual-wayfinding",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-room-312",
      actionType: "enable_visual_wayfinding",
      kind: "set_room_accessibility",
      label: "Enable visual wayfinding cues",
      description: "Enable fictional high-contrast wayfinding cues for Room 3.12.",
      risk: "low_risk_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 5_000,
      postconditions: ["enable_visual_wayfinding"],
    },
    {
      id: "cap-room-312-low-glare",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-room-312",
      actionType: "enable_low_glare",
      kind: "set_room_accessibility",
      label: "Enable low-glare lighting",
      description: "Set fictional Room 3.12 lighting to low glare.",
      risk: "low_risk_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 5_000,
      postconditions: ["enable_low_glare"],
    },
    {
      id: "cap-reception-assist",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-reception-assist",
      actionType: "request_staff_assistance",
      kind: "request_staff_assistance",
      label: "Request staff assistance",
      description: "Queue a fictional reception assistance request.",
      risk: "read_only",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: false,
      // Communication / assistance request — allowed even if emergency flag set for messaging,
      // but still requireEmergencyModeOff false so it remains available.
      requireEmergencyModeOff: false,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 8_000,
      postconditions: ["assistance_queued"],
    },
    {
      id: "cap-robot-escort-sim",
      placeId: HARBOUR_PLACE_ID,
      deviceId: "dev-robot-escort-sim",
      actionType: "dispatch_simulated_robot_escort",
      kind: "dispatch_simulated_robot_escort",
      label: "Dispatch simulated robot escort",
      description:
        "Clearly simulated robot escort — no real robot is controlled.",
      risk: "supervised_actuation",
      enabled: true,
      requireUserApproval: true,
      requireVenueApproval: true,
      requireEmergencyModeOff: true,
      simulatedOnly: true,
      clearlySimulated: true,
      fictionalNotice: FICTIONAL,
      timeoutMs: 30_000,
      postconditions: ["robot_dispatched_sim"],
    },
  ];

  return caps;
}
