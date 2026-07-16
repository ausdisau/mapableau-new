import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { listHarbourCapabilities } from "@/lib/access-intelligence/physical/capabilities/harbour";
import { getPhysicalConfigurationSnapshot } from "@/lib/access-intelligence/physical/configuration";
import { getHarbourPhysicalSimulator } from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const state = getHarbourPhysicalSimulator().getState();
    return Response.json({
      configuration: getPhysicalConfigurationSnapshot(),
      emergency: state.emergency,
      devices: state.devices,
      capabilities: listHarbourCapabilities({
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        emergencyActive: state.emergency.active,
        devices: state.devices,
      }),
      observations: state.observations,
      generatedAt: new Date().toISOString(),
      fictionalNotice:
        "Environment state is simulated. Poll this endpoint for updates; no live BMS claim.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
