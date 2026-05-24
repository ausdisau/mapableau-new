import { CorePageHeader } from "@/components/core/CorePageHeader";
import { getConfiguredOAuthProviderIds } from "@/lib/auth/oauth-providers";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviderIds();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        title="Create account"
        description="Register with email or sign in with Google or Microsoft."
      />
      <RegisterClient oauthProviders={oauthProviders} />
    </div>
  );
}
