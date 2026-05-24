import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth/auth0";
import { getProfileIdFromAuth0Session } from "@/lib/auth/auth-bridge-service";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const profileId = await getProfileIdFromAuth0Session(session);
  if (!profileId) {
    return NextResponse.json(
      {
        authenticated: true,
        profile: null,
        message: "MapAble profile not linked",
      },
      { status: 200 },
    );
  }

  const profile = await getCurrentUserProfile(profileId);
  if (!profile) {
    return NextResponse.json({ authenticated: true, profile: null }, { status: 404 });
  }

  return NextResponse.json({
    authenticated: true,
    profile,
    auth0: {
      sub: session.user.sub,
      email: session.user.email,
      name: session.user.name,
    },
  });
}
