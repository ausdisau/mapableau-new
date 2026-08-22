import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { personalAgencyFlags, personalAgencyDisabledResponse } from "@/lib/config/personal-agency";
import { savePaiSetupPreferences, getPaiSetupPreferences } from "@/lib/personal-agency/setup-service";

const setupSchema = z.object({
  helpAreas: z.array(z.string()).optional(),
  interfaceMethods: z.array(z.string()).optional(),
  travelMode: z.string().optional(),
  informationDensity: z.enum(["standard", "simpler", "detailed"]).optional(),
});

export async function POST(req: Request) {
  if (!personalAgencyFlags.firstRunSetupEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_PAI_FIRST_RUN");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const prefs = await savePaiSetupPreferences(user.id, parsed.data);
  return jsonOk({ preferences: prefs });
}

export async function GET() {
  if (!personalAgencyFlags.routesEnabled) {
    return personalAgencyDisabledResponse("MAPABLE_PERSONAL_AGENCY_UI");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const prefs = await getPaiSetupPreferences(user.id);
  return jsonOk({ preferences: prefs });
}
