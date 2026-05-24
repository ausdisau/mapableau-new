import { requireAdmin } from "@/lib/auth/guards";
import {
  ensureDefaultChecklists,
  generateChecklistMarkdown,
} from "@/lib/qa/qa-checklist-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "QA checklists | Admin" };

export default async function QaChecklistsPage() {
  await requireAdmin();
  await ensureDefaultChecklists();
  const checklists = await prisma.qaChecklist.findMany({
    include: { items: true },
    take: 20,
  });
  const sample = checklists[0]
    ? await generateChecklistMarkdown(checklists[0].id)
    : "";

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">QA checklists</h1>
      <ul className="divide-y rounded-lg border">
        {checklists.map((c) => (
          <li key={c.id} className="p-4">
            <div className="font-medium">{c.title}</div>
            <div className="text-xs text-muted-foreground">{c.area}</div>
          </li>
        ))}
      </ul>
      {sample ? (
        <pre className="overflow-auto rounded-lg border bg-muted p-4 text-xs">{sample}</pre>
      ) : null}
    </div>
  );
}
