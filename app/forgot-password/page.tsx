import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";

import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = {
  title: "Forgot password | MapAble",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        title="Forgot password"
        description="Enter your email and we will send a link to reset your password."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading form…</p>
        }
      >
        <ForgotPasswordClient />
      </Suspense>
    </div>
  );
}
