import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  buildHarbourLivingTwin,
  HARBOUR_PLACE_ID,
} from "@/lib/access-intelligence/living/harbour-civic";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { listHarbourCapabilities } from "@/lib/access-intelligence/physical/capabilities/harbour";
import { getHarbourPhysicalSimulator } from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const sim = getHarbourPhysicalSimulator();
    const state = sim.getState();
    const twin = state.twin ?? buildHarbourLivingTwin();
    return Response.json({
      place: twin.place,
      placeId: HARBOUR_PLACE_ID,
      destinations: twin.destinations,
      devices: state.devices,
      emergency: state.emergency,
      capabilities: listHarbourCapabilities({
        mainLiftOutage: state.mainLiftOutage,
        doorEntBFault: state.doorEntBFault,
        emergencyActive: state.emergency.active,
        devices: state.devices,
      }),
      fictionalNotice: twin.fictionalNotice,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
