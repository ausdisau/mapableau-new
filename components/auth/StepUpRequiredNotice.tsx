"use client";

import {
  STEP_UP_ACTIONS,
  type StepUpActionKey,
} from "@/lib/auth/step-up/step-up-policy";

export function StepUpRequiredNotice({
  actionKey,
  returnTo = "/dashboard",
}: {
  actionKey: StepUpActionKey;
  returnTo?: string;
}) {
  const action = STEP_UP_ACTIONS[actionKey];
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <p className="font-medium">Additional verification required</p>
      <p className="mt-1 text-muted-foreground">
        For your security, please sign in again before: {action.label}.
      </p>
      <a
        href={`/auth/login?prompt=login&returnTo=${encodeURIComponent(returnTo)}`}
        className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Verify identity
      </a>
    </div>
  );
}
