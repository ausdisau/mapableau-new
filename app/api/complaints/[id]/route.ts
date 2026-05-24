import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canAccessComplaint } from "@/lib/disputes/access";
import { getComplaintById } from "@/lib/complaints/complaint-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const complaint = await getComplaintById(id);
  if (!complaint) return jsonError("Not found", 404);

  const allowed = await canAccessComplaint(user, complaint);
  if (!allowed) return jsonError("Forbidden", 403);

  const isParticipant = complaint.participantId === user.id;
  const responses = isParticipant
    ? complaint.responses.filter((r) => !r.isInternal)
    : complaint.responses;

  return jsonOk({
    complaint: { ...complaint, responses },
  });
}
