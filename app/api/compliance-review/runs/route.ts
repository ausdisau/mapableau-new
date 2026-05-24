import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  runChecklist,
  type ChecklistId,
} from "@/lib/compliance-review/checklist-engine";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  checklistId: z.string(),
  moduleScope: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const items = runChecklist(body.checklistId as ChecklistId);
  const run = await prisma.complianceReviewRun.create({
    data: {
      checklistId: body.checklistId,
      moduleScope: body.moduleScope,
      createdById: user.id,
      findings: {
        create: items.map((item) => ({
          severity: item.severity,
          module: body.moduleScope,
          recommendation: item.recommendation,
          status: "draft",
        })),
      },
    },
    include: { findings: true },
  });
  return jsonOk({ run });
}
