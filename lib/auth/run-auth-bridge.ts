import {
  createOrLinkMapableProfile,
  type Auth0IdentityPayload,
} from "@/lib/auth/create-or-link-mapable-profile";
import { getAuth0SessionUser } from "@/lib/auth/auth-profile-bridge";

export async function runAuthBridgeIfNeeded(): Promise<{
  bridged: boolean;
  linkingRequired?: boolean;
  profileId?: string;
}> {
  const authUser = await getAuth0SessionUser();
  if (!authUser?.sub) return { bridged: false };

  const identity: Auth0IdentityPayload = {
    sub: authUser.sub,
    email: typeof authUser.email === "string" ? authUser.email : undefined,
    email_verified:
      typeof authUser.email_verified === "boolean"
        ? authUser.email_verified
        : undefined,
    name: typeof authUser.name === "string" ? authUser.name : undefined,
    picture: typeof authUser.picture === "string" ? authUser.picture : undefined,
  };

  const result = await createOrLinkMapableProfile(identity);
  if (result.status === "linking_required") {
    return { bridged: false, linkingRequired: true };
  }
  return { bridged: true, profileId: result.profileId };
}
