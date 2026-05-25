import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";

import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Create account | MapAble",
  description:
    "Register for MapAble Core to manage bookings, accessibility preferences, and messages.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        eyebrow="MapAble Core"
        title="Create your account"
        description="Join MapAble to find support, manage bookings, and keep your accessibility preferences in one place."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading registration form…</p>
        }
      >
        <RegisterClient />
      </Suspense>
    </div>
  );
}
