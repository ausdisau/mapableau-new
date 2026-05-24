import { NextResponse } from "next/server";

import {
  confirmEmailLink,
  getLinkedIdentities,
  linkIdentityToProfile,
} from "@/lib/auth/account-linking-service";
import { auth0 } from "@/lib/auth/auth0";
import { getProfileIdFromAuth0Session } from "@/lib/auth/auth-bridge-service";
import { apiForbidden, apiUnauthorized, requireAuth } from "@/lib/auth/guards";
import { linkIdentitySchema } from "@/lib/validation/auth";

export async function GET() {
  const user = await requireAuth();
  const identities = await getLinkedIdentities(user.id);
  return NextResponse.json({ identities });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  const body = linkIdentitySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const link = await linkIdentityToProfile({
      profileId: user.id,
      auth0UserId: body.data.auth0UserId,
      provider: body.data.provider,
      email: body.data.email,
    });
    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_ALREADY_LINKED") {
      return apiForbidden("Identity is already linked to another profile");
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  const session = await auth0.getSession();
  if (!session?.user.sub || !session.user.email) {
    return apiUnauthorized();
  }

  const body = linkIdentitySchema.safeParse(await request.json());
  if (!body.success || !body.data.confirm) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const profileId = await getProfileIdFromAuth0Session(session);
  if (!profileId) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    const link = await confirmEmailLink({
      profileId,
      auth0UserId: session.user.sub,
      provider: body.data.provider,
      email: session.user.email,
    });
    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_MISMATCH") {
      return apiForbidden("Email does not match the existing MapAble profile");
    }
    throw error;
  }
}
