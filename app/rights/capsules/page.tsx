import { requireAuth } from "@/lib/auth/guards";
import {
  isAccessCapsulesEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { prisma } from "@/lib/prisma";

export default async function CapsulesPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isAccessCapsulesEnabled()) {
    return <p>Access Capsules are not enabled.</p>;
  }

  const capsules = await prisma.accessCapsule.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Access Capsules</h2>
      <p className="text-sm text-muted-foreground">
        Time-limited, purpose-bound disclosures. QR, secure link, printable card, and
        telephone verification alternatives are available.
      </p>
      <ul className="divide-y rounded-lg border">
        {capsules.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No capsules yet.</li>
        ) : (
          capsules.map((capsule) => (
            <li key={capsule.id} className="p-4">
              <p className="font-medium">{capsule.purposeCode}</p>
              <p className="text-sm text-muted-foreground">
                Status: {capsule.status} · Method: {capsule.presentationMethod}
              </p>
              {capsule.expiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Expires {capsule.expiresAt.toLocaleString("en-AU")}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
