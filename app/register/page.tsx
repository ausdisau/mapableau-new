import { Suspense } from "react";

import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviders();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="mb-4 flex justify-center">
        <MapAbleLogo variant="mark" ariaLabel="MapAble home" />
      </div>
      <CorePageHeader
        eyebrow="MapAble"
        title="Create account"
        description="Set up access to find support, request care, book transport, and manage your dashboard."
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
        <RegisterClient oauthProviders={oauthProviders} />
      </Suspense>
    </div>
  );
}
