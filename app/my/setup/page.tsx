import { redirect } from "next/navigation";

import { FirstRunSetup } from "@/components/personal-agency/FirstRunSetup";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "Welcome | My MapAble" };

export default async function MySetupPage() {
  if (!personalAgencyFlags.firstRunSetupEnabled) redirect("/my");
  await requirePersonalAgencyGate();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to My MapAble</h1>
        <p className="mt-2 text-muted-foreground">
          A few optional choices to personalise your workspace. You can skip any step.
        </p>
      </header>
      <FirstRunSetup />
    </div>
  );
}
