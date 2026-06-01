import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviders();
  return <RegisterClient oauthProviders={oauthProviders} />;
}
