import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  await requireAuth();
  const { workerId } = await params;
  const profile = await prisma.workerProfile.findUnique({ where: { id: workerId } });
  if (!profile) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{profile.displayName}</h1>
      <StatusTextBadge status={profile.verificationStatus} />
      <p>{profile.profileSummary}</p>
      <Link href="/provider/documents" className="text-primary underline">
        Manage compliance documents
      </Link>
    </div>
  );
}
