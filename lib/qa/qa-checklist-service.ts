import { prisma } from "@/lib/prisma";

const DEFAULT_AREAS = [
  "accessibility",
  "auth",
  "bookings",
  "messaging",
  "invoices",
  "verification",
  "transport",
  "documents",
  "privacy",
  "mobile",
];

export async function ensureDefaultChecklists() {
  for (const area of DEFAULT_AREAS) {
    const existing = await prisma.qaChecklist.findFirst({ where: { area } });
    if (existing) continue;

    await prisma.qaChecklist.create({
      data: {
        title: `Release checklist — ${area}`,
        area,
        items: {
          create: [
            { label: `Smoke test ${area} flows`, order: 1 },
            { label: `Keyboard navigation ${area}`, order: 2 },
            { label: `Error states ${area}`, order: 3 },
          ],
        },
      },
    });
  }
}

export async function generateChecklistMarkdown(checklistId: string) {
  const checklist = await prisma.qaChecklist.findUnique({
    where: { id: checklistId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!checklist) throw new Error("NOT_FOUND");

  const lines = [
    `# ${checklist.title}`,
    "",
    ...checklist.items.map((i) => `- [ ] ${i.label}`),
  ];
  return lines.join("\n");
}

export async function startChecklistRun(checklistId: string, createdBy?: string) {
  return prisma.qaChecklistRun.create({
    data: { checklistId, createdBy, status: "in_progress" },
  });
}

export async function completeChecklistRun(
  runId: string,
  completed: Record<string, boolean>
) {
  return prisma.qaChecklistRun.update({
    where: { id: runId },
    data: {
      status: "completed",
      completedJson: completed,
    },
  });
}
