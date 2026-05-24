import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { MfaChallengeForm } from "@/components/security/MfaChallengeForm";
import { STEP_UP_ACTIONS, type StepUpAction } from "@/lib/auth/mfa-policy";

type MfaPageProps = {
  searchParams: Promise<{
    mode?: string;
    action?: string;
    callbackUrl?: string;
  }>;
};

export const metadata = { title: "Verify sign-in | MapAble" };

function parseAction(action?: string): StepUpAction | undefined {
  if (!action) return undefined;
  return STEP_UP_ACTIONS.includes(action as StepUpAction)
    ? (action as StepUpAction)
    : undefined;
}

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const mode = params.mode === "step_up" ? "step_up" : "login";
  const action = parseAction(params.action);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground" role="status">
            Loading verification…
          </p>
        }
      >
        <MfaChallengeForm mode={mode} action={action} />
      </Suspense>
    </div>
  );
}
