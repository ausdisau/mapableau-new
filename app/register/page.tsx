import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";
import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviders();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <CorePageHeader
        eyebrow="MapAble Core"
        title="Create account"
        description="Set up access to care requests, transport, and your dashboard."
        centered
        className="mb-8 border-0 pb-0"
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading registration form…
          </p>
        }
      >
        <RegisterClient
          oauthProviders={oauthProviders}
          neonAuthEnabled={isNeonAuthEnabled()}
        />
      </Suspense>
    </div>
  );
}
