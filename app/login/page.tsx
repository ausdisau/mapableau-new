import { Suspense } from "react";

import { CorePageContainer, CorePageHeader } from "@/components/core";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <CorePageContainer variant="narrow" className="max-w-md">
      <CorePageHeader
        title="Sign in"
        description="Access your MapAble Core dashboard, bookings and messages."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading sign-in form…</p>
        }
      >
        <LoginClient />
      </Suspense>
    </CorePageContainer>
  );
}
