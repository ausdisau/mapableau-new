import Link from "next/link";
import { redirect } from "next/navigation";

import { LifeIntentCard } from "@/components/personal-agency/LifeIntentCard";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requireLifeIntentGate } from "@/lib/personal-agency/gates";
import { listLifeIntentsForPrincipal } from "@/lib/personal-agency/life-intent-service";

export const metadata = { title: "My Life | My MapAble" };

export default async function MyLifePage() {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    redirect("/my");
  }
  const user = await requireLifeIntentGate();
  const intents = await listLifeIntentsForPrincipal(user.id);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Life</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            What matters to you — in your own words.
          </p>
        </div>
        <Link
          href="/my/life/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-[#F8C51C] px-4 py-2 text-sm font-bold text-[#0C1833]"
        >
          + Add something that matters to me
        </Link>
      </header>

      {intents.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {intents.map((intent) => (
            <li key={intent.id}>
              <LifeIntentCard
                id={intent.id}
                originalExpression={intent.originalExpression}
                status={intent.status}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
          <p className="text-lg font-semibold">Nothing here yet.</p>
          <p className="mt-2 text-sm text-slate-600">
            What would you like to do, change, explore or work towards?
          </p>
          <Link
            href="/my/life/new"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
          >
            Add something that matters
          </Link>
        </div>
      )}
    </div>
  );
}
