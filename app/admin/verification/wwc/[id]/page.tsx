import Link from "next/link";
import { notFound } from "next/navigation";

import { WwcReviewPanel } from "@/components/admin-verification/wwc/WwcReviewPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminWwcVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const verification = await prisma.wwcVerification.findUnique({
    where: { id },
    include: {
      workerProfile: true,
      organisation: { select: { name: true } },
      events: { orderBy: { createdAt: "desc" } },
      evidenceDocument: {
        select: { id: true, title: true },
      },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!verification) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/verification/wwc" className="text-sm text-primary hover:underline">
        ← WWC queue
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">
          {verification.workerProfile.displayName}
        </h1>
        <p className="text-muted-foreground">{verification.organisation.name}</p>
      </header>
      <WwcReviewPanel verification={verification} />
    </div>
  );
}
