import { notFound } from "next/navigation";

import { MyDayResilienceSimulator } from "@/components/my-day-resilience/MyDayResilienceSimulator";
import { requireAuth } from "@/lib/auth/guards";
import { isMyDayResilienceEnabled } from "@/lib/my-day-resilience/flags";

export const metadata = {
  title: "My Day Resilience Simulator (synthetic) | MapAble",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MyDayResiliencePage() {
  if (!isMyDayResilienceEnabled()) notFound();

  const user = await requireAuth();
  if (
    !user.roles.includes("participant") &&
    user.primaryRole !== "mapable_admin"
  ) {
    notFound();
  }

  // No real participant private life data is loaded.
  return <MyDayResilienceSimulator />;
}
