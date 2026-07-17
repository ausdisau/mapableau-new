import { KeyboardAuthoringPanel } from "@/components/indoor-accessibility/authoring/KeyboardAuthoringPanel";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };

export default async function FloorPlanEditPage({ params }: PageParams) {
  await requirePermission("admin:dashboard");
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-950">
          Edit floor plan
        </h1>
        <p className="text-sm text-slate-700">
          Keyboard-first authoring path for floor plan {id}. Mouse drawing is
          optional; labelled coordinate entry is the supported baseline.
        </p>
      </header>
      <KeyboardAuthoringPanel floorPlanId={id} />
    </main>
  );
}
