import { SupportWorkerSearchForm } from "@/components/support-workers/SupportWorkerSearchForm";
import { requireAuth } from "@/lib/auth/guards";

export default async function SupportWorkerSearchPage() {
  await requireAuth();

  return (
    <main className="container max-w-3xl py-10">
      <h1 className="font-heading mb-2 text-2xl font-bold">
        Find a support worker
      </h1>
      <p className="mb-8 text-muted-foreground">
        MapAble uses clear rules — not a black-box AI — to suggest workers who
        fit your support type, availability, location, and preferences. You
        choose who to contact; nothing is assigned automatically.
      </p>
      <SupportWorkerSearchForm />
    </main>
  );
}
