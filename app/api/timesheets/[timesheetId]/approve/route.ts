import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { approveTimesheet } from "@/lib/timesheets/timesheet-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ timesheetId: string }> }
) {
  const user = await requireApiPermission("timesheet:approve:self");
  if (user instanceof Response) return user;
  const { timesheetId } = await params;
  const ts = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!ts || ts.participantId !== user.id) return jsonError("Not found", 404);
  const updated = await approveTimesheet(timesheetId, user.id);
  return jsonOk({ timesheet: updated });
}
