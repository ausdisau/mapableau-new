import { createClient, OAuthStrategy, type OauthData } from "@wix/sdk";
import { members } from "@wix/members";

import { getWixConfig } from "@/lib/auth/wix/wix-config";

export type WixMemberProfile = {
  memberId: string;
  email: string | null;
  name: string | null;
};

function createWixOAuth() {
  const { clientId } = getWixConfig();
  if (!clientId) {
    throw new Error("WIX_CLIENT_ID is not configured");
  }
  return OAuthStrategy({ clientId });
}

export function generateWixOAuthData(redirectUri: string, originalUri: string) {
  const auth = createWixOAuth();
  return auth.generateOAuthData(redirectUri, originalUri);
}

export async function getWixLoginAuthUrl(oauthData: OauthData): Promise<string> {
  const auth = createWixOAuth();
  const { authUrl } = await auth.getAuthUrl(oauthData, {
    responseMode: "fragment",
  });
  return authUrl;
}

export async function fetchWixMemberProfile(
  oauthData: OauthData,
  code: string,
  state: string
): Promise<WixMemberProfile> {
  const auth = createWixOAuth();
  const tokens = await auth.getMemberTokens(code, state, oauthData);

  const wixClient = createClient({
    modules: { members },
    auth,
  });
  wixClient.auth.setTokens(tokens);

  const response = await wixClient.members.getCurrentMember();
  const member = response.member;
  if (!member?._id) {
    throw new Error("Wix member profile missing id");
  }

  const contactEmail = member.contact?.emails?.find(
    (entry) => typeof entry === "string" && entry.includes("@")
  );
  const email =
    member.loginEmail?.toLowerCase() ??
    (typeof contactEmail === "string" ? contactEmail.toLowerCase() : null) ??
    null;

  const name =
    member.profile?.nickname ??
    member.contact?.firstName ??
    member.loginEmail ??
    null;

  return {
    memberId: member._id,
    email,
    name,
  };
}

export async function getWixLogoutUrl(originalUrl: string): Promise<string> {
  const auth = createWixOAuth();
  const { logoutUrl } = await auth.logout(originalUrl);
  return logoutUrl;
}
