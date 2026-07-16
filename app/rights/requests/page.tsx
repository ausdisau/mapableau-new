import { requireAuth } from "@/lib/auth/guards";
import {
  isRightsCentreEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { prisma } from "@/lib/prisma";

export default async function RightsRequestsPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isRightsCentreEnabled()) {
    return <p>Rights Centre is not enabled.</p>;
  }

  const requests = await prisma.rightsRequest.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Rights requests</h2>
      <p className="text-sm text-muted-foreground">
        Request access, correction, export, deletion, or explanation. A human officer
        reviews requests where required.
      </p>
      <ul className="divide-y rounded-lg border">
        {requests.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No requests yet.</li>
        ) : (
          requests.map((request) => (
            <li key={request.id} className="p-4">
              <p className="font-medium">{request.requestType}</p>
              <p className="text-sm text-muted-foreground">Status: {request.status}</p>
              {request.limitationNote ? (
                <p className="text-xs text-muted-foreground">{request.limitationNote}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
