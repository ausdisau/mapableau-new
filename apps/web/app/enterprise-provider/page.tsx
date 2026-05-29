import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EnterpriseProviderHomePage() {
  const user = await requirePermission("enterprise:console");
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    include: { organisation: true },
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Enterprise provider console</h1>
      <p className="text-muted-foreground">
        Organisation-scoped operations for your team.
      </p>
      {membership ? (
        <nav aria-label="Enterprise sections">
          <ul className="flex flex-col gap-2">
            <li>
              <Link className="text-primary underline" href="/provider/care">
                Care
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" href="/provider/transport">
                Transport
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" href="/provider/support">
                Support
              </Link>
            </li>
          </ul>
        </nav>
      ) : (
        <p>No organisation linked to your account.</p>
      )}
    </div>
  );
}
