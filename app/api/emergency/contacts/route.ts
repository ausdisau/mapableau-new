import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { addEmergencyContact } from "@/lib/emergency/contact-service";
import { getEmergencyProfile } from "@/lib/emergency/profile-service";
import { emergencyContactSchema } from "@/lib/validation/emergency";

export async function GET() {
  const user = await requireApiPermission("emergency:read:self");
  if (user instanceof Response) return user;
  const profile = await getEmergencyProfile(user.id);
  return jsonOk({ contacts: profile?.contacts ?? [] });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("emergency:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = emergencyContactSchema.parse(await req.json());
    const contact = await addEmergencyContact(
      user.id,
      {
        ...parsed,
        email: parsed.email || undefined,
      },
      user.id,
    );
    return jsonOk({ contact }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
