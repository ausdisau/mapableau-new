import Link from "next/link";

import { WwcVerificationQueue } from "@/components/admin-verification/wwc/WwcVerificationQueue";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "WWC verification queue | Admin" };

export default async function AdminWwcVerificationPage() {
  await requireAdmin();

  const verifications = await prisma.wwcVerification.findMany({
    where: { status: { in: ["pending_review", "needs_more_information"] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      workerProfile: { select: { displayName: true } },
      organisation: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Admin
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">WWC verification queue</h1>
        <p className="text-muted-foreground">
          Review Working With Children and equivalent checks. Evidence stays private to authorised staff.
        </p>
      </header>
      <WwcVerificationQueue items={verifications} />
    </div>
  );
}
