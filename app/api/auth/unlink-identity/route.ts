import { NextResponse } from "next/server";

import { unlinkIdentity } from "@/lib/auth/account-linking-service";
import { apiForbidden, requireAuth } from "@/lib/auth/guards";
import { unlinkIdentitySchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const user = await requireAuth();
  const body = unlinkIdentitySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await unlinkIdentity({ profileId: user.id, linkId: body.data.linkId });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LAST_IDENTITY_CANNOT_BE_UNLINKED") {
        return apiForbidden("At least one sign-in method must remain linked");
      }
      if (error.message === "LINK_NOT_FOUND") {
        return NextResponse.json({ error: "Link not found" }, { status: 404 });
      }
    }
    throw error;
  }
}
