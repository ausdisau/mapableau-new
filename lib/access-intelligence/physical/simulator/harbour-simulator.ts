import {
  buildHarbourLivingTwin,
  HARBOUR_PLACE_ID,
  MAIN_LIFT_OUTAGE_INCIDENT,
} from "../../living/harbour-civic";
import type { LivingAccessTwin } from "../../living/schemas";
import type { LiveIncident } from "../../schemas";
import {
  listRegisteredAdapters,
  resetAllAdapters,
  getAdapterForDevice,
} from "../adapters/registry";
import type { DeviceState, EmergencyModeState, EnvironmentObservation } from "../schemas";
import { recordMetric } from "../observability";

export type HarbourSimulatorEvent =
  | "main_lift_outage"
  | "main_lift_restore"
  | "door_fault"
  | "door_restore"
  | "corridor_obstruction"
  | "emergency_on"
  | "emergency_off"
  | "toilet_confirm_open"
  | "toilet_unknown"
  | "lift_west_arrive"
  | "lift_west_timeout";

export type HarbourSimulatorState = {
  twin: LivingAccessTwin;
  devices: DeviceState[];
  emergency: EmergencyModeState;
  observations: EnvironmentObservation[];
  mainLiftOutage: boolean;
  doorEntBFault: boolean;
  corridorObstructed: boolean;
  toiletConfirmed: boolean | null;
  eventLog: Array<{ at: string; event: HarbourSimulatorEvent }>;
};

function snapshotDevices(): DeviceState[] {
  return listRegisteredAdapters().map((a) => a.getState());
}

export class HarbourPhysicalSimulator {
  private twin: LivingAccessTwin;
  private emergency: EmergencyModeState;
  private observations: EnvironmentObservation[];
  private mainLiftOutage: boolean;
  private doorEntBFault: boolean;
  private corridorObstructed: boolean;
  private toiletConfirmed: boolean | null;
  private eventLog: Array<{ at: string; event: HarbourSimulatorEvent }>;

  constructor() {
    this.twin = buildHarbourLivingTwin();
    this.emergency = { active: false };
    this.observations = [];
    this.mainLiftOutage = false;
    this.doorEntBFault = false;
    this.corridorObstructed = false;
    this.toiletConfirmed = null;
    this.eventLog = [];
    resetAllAdapters();
  }

  getTwin(): LivingAccessTwin {
    return this.twin;
  }

  getState(): HarbourSimulatorState {
    return {
      twin: this.twin,
      devices: snapshotDevices(),
      emergency: { ...this.emergency },
      observations: [...this.observations],
      mainLiftOutage: this.mainLiftOutage,
      doorEntBFault: this.doorEntBFault,
      corridorObstructed: this.corridorObstructed,
      toiletConfirmed: this.toiletConfirmed,
      eventLog: [...this.eventLog],
    };
  }

  getEmergency(): EmergencyModeState {
    return { ...this.emergency };
  }

  getDevice(deviceId: string): DeviceState {
    return getAdapterForDevice(deviceId).getState();
  }

  setDeviceState(deviceId: string, patch: Partial<DeviceState>): DeviceState {
    return getAdapterForDevice(deviceId).setState(patch);
  }

  reset(): void {
    resetAllAdapters();
    this.twin = buildHarbourLivingTwin();
    this.emergency = { active: false };
    this.observations = [];
    this.mainLiftOutage = false;
    this.doorEntBFault = false;
    this.corridorObstructed = false;
    this.toiletConfirmed = null;
    this.eventLog = [];
  }

  emitEvent(eventType: HarbourSimulatorEvent): HarbourSimulatorState {
    const at = new Date().toISOString();
    this.eventLog.push({ at, event: eventType });
    recordMetric("physical_simulator_event", { event: eventType });

    switch (eventType) {
      case "main_lift_outage":
        this.applyMainLiftOutage(at);
        break;
      case "main_lift_restore":
        this.applyMainLiftRestore(at);
        break;
      case "door_fault":
        this.doorEntBFault = true;
        this.setDeviceState("dev-door-ent-b", {
          health: "unhealthy",
          condition: "fault",
          online: true,
        });
        this.pushObservation({
          id: `obs-door-fault-${at}`,
          placeId: HARBOUR_PLACE_ID,
          subjectId: "dev-door-ent-b",
          subjectKind: "device",
          summary: "Entrance B automatic door fault (simulated).",
          condition: "fault",
          observedAt: at,
          source: "simulator",
          confidence: 1,
          fictional: true,
        });
        break;
      case "door_restore":
        this.doorEntBFault = false;
        this.setDeviceState("dev-door-ent-b", {
          health: "healthy",
          condition: "normal",
          online: true,
          metadata: { open: false },
        });
        break;
      case "corridor_obstruction":
        this.corridorObstructed = true;
        this.twin = {
          ...this.twin,
          edges: this.twin.edges.map((e) =>
            e.id === "e-hcc-corr-room" || e.id === "e-hcc-display-narrow"
              ? { ...e, temporaryBarrier: true }
              : e,
          ),
          incidents: [
            ...this.twin.incidents.filter((i) => i.id !== "inc-hcc-corr-block"),
            {
              id: "inc-hcc-corr-block",
              placeId: HARBOUR_PLACE_ID,
              elementId: "hcc-corr-3",
              type: "blocked_route",
              severity: "moderate",
              description: "Level 3 corridor obstruction (simulated).",
              sourceType: "system_feed",
              reportedAt: at,
              status: "active",
              affectedEdgeIds: ["e-hcc-corr-room", "e-hcc-display-narrow"],
            } satisfies LiveIncident,
          ],
          updatedAt: at,
        };
        this.pushObservation({
          id: `obs-corr-${at}`,
          placeId: HARBOUR_PLACE_ID,
          subjectId: "hcc-corr-3",
          subjectKind: "corridor",
          summary: "Corridor obstruction present (simulated).",
          condition: "obstructed",
          observedAt: at,
          source: "simulator",
          confidence: 0.95,
          fictional: true,
        });
        break;
      case "emergency_on":
        this.emergency = {
          active: true,
          reason: "Simulated building emergency mode.",
          activatedAt: at,
          source: "simulator",
        };
        for (const adapter of listRegisteredAdapters()) {
          if (adapter.deviceId === "dev-reception-assist") continue;
          adapter.setState({ condition: "emergency" });
        }
        break;
      case "emergency_off":
        this.emergency = { active: false };
        for (const adapter of listRegisteredAdapters()) {
          const s = adapter.getState();
          if (s.condition === "emergency") {
            adapter.setState({
              condition: this.mainLiftOutage && adapter.deviceId === "dev-lift-main"
                ? "outage"
                : this.doorEntBFault && adapter.deviceId === "dev-door-ent-b"
                  ? "fault"
                  : "normal",
            });
          }
        }
        break;
      case "toilet_confirm_open":
        this.toiletConfirmed = true;
        this.twin = {
          ...this.twin,
          features: this.twin.features.map((f) =>
            f.featureType === "accessible_toilet"
              ? {
                  ...f,
                  value: true,
                  confidence: 0.95,
                  notes: "Operating — confirmed open (simulated).",
                  observedAt: at,
                }
              : f,
          ),
          updatedAt: at,
        };
        break;
      case "toilet_unknown":
        this.toiletConfirmed = null;
        this.twin = {
          ...this.twin,
          features: this.twin.features.map((f) =>
            f.featureType === "accessible_toilet"
              ? {
                  ...f,
                  notes: "Operational status unknown (simulated).",
                  confidence: Math.min(f.confidence, 0.4),
                }
              : f,
          ),
          updatedAt: at,
        };
        break;
      case "lift_west_arrive":
        this.setDeviceState("dev-lift-west", {
          health: "healthy",
          condition: "normal",
          metadata: { cabin: "arrived" },
        });
        break;
      case "lift_west_timeout":
        this.setDeviceState("dev-lift-west", {
          health: "degraded",
          condition: "degraded",
          metadata: { cabin: "timeout" },
        });
        break;
      default: {
        const _exhaustive: never = eventType;
        return _exhaustive;
      }
    }

    return this.getState();
  }

  /** Called by transaction manager after adapter ack in demo. */
  tickForExecution(capabilityId: string): void {
    if (capabilityId === "cap-lift-west-call") {
      const cabin = this.getDevice("dev-lift-west").metadata?.["cabin"];
      if (cabin === "called") {
        this.emitEvent("lift_west_arrive");
      }
    }
  }

  private applyMainLiftOutage(at: string): void {
    this.mainLiftOutage = true;
    this.setDeviceState("dev-lift-main", {
      health: "unhealthy",
      condition: "outage",
      online: true,
      metadata: { cabin: "outage" },
    });
    const incident: LiveIncident = {
      ...MAIN_LIFT_OUTAGE_INCIDENT,
      reportedAt: at,
      status: "active",
    };
    this.twin = buildHarbourLivingTwin({
      incidents: [
        ...this.twin.incidents.filter((i) => i.id !== incident.id),
        incident,
      ],
      features: this.twin.features,
      edges: this.twin.edges,
      operatingRules: this.twin.operatingRules,
    });
  }

  private applyMainLiftRestore(at: string): void {
    this.mainLiftOutage = false;
    this.setDeviceState("dev-lift-main", {
      health: "healthy",
      condition: "normal",
      online: true,
      metadata: { cabin: "idle" },
    });
    this.twin = {
      ...this.twin,
      incidents: this.twin.incidents.map((i) =>
        i.id === MAIN_LIFT_OUTAGE_INCIDENT.id
          ? { ...i, status: "resolved" as const, confirmedAt: at }
          : i,
      ),
      updatedAt: at,
    };
  }

  private pushObservation(obs: EnvironmentObservation): void {
    this.observations = [obs, ...this.observations].slice(0, 50);
  }
}

let singleton: HarbourPhysicalSimulator | null = null;

export function getHarbourPhysicalSimulator(): HarbourPhysicalSimulator {
  if (!singleton) singleton = new HarbourPhysicalSimulator();
  return singleton;
}

export function resetHarbourPhysicalSimulator(): HarbourPhysicalSimulator {
  singleton = new HarbourPhysicalSimulator();
  return singleton;
}
