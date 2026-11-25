import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { clerkLoginSelected } from "@/lib/auth/adid-config";

import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset password | MapAble",
};

export default function ResetPasswordPage() {
  if (clerkLoginSelected()) redirect("/login");
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <CorePageHeader
        title="Reset password"
        description="Choose a new password for your MapAble account."
      />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading form…</p>
        }
      >
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}
