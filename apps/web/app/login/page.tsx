import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";

import LoginClient from "./LoginClient";

export default function LoginPage() {
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
        <LoginClient />
      </Suspense>
    </div>
  );
}
