import { Suspense } from "react";

import { getAuth0SocialConnections } from "@/lib/auth/auth0-social-connections";
import { CorePageHeader } from "@/components/core/CorePageHeader";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  const auth0SocialConnections = getAuth0SocialConnections();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        title="Sign in"
        description="Access your MapAble Core dashboard, bookings and messages."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading sign-in form…</p>
        }
      >
        <LoginClient auth0SocialConnections={auth0SocialConnections} />
      </Suspense>
    </div>
  );
}
