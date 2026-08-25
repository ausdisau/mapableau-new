import Link from "next/link";
import { notFound } from "next/navigation";

import { HumanOpsReviewDetail } from "@/components/admin/ai/HumanOpsReviewDetail";
import {
  formatReviewForOperator,
  getHumanOpsReview,
  listHumanOpsAuditForReview,
} from "@/lib/ai/platform/human-operations";
import { requireAdminOpsAccess } from "@/lib/auth/guards";
import { isHumanOperationsConsoleEnabled } from "@/lib/config/human-operations";

export const metadata = {
  title: "Human Ops Review | MapAble Admin",
};

type PageProps = { params: Promise<{ reviewId: string }> };

export default async function AdminHumanOpsReviewPage({ params }: PageProps) {
  await requireAdminOpsAccess();
  if (!isHumanOperationsConsoleEnabled()) {
    return (
      <div className="p-6 text-muted-foreground" role="status">
        Human Operations Console is disabled.
      </div>
    );
  }

  const { reviewId } = await params;
  const item = getHumanOpsReview(reviewId);
  if (!item) notFound();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-2 text-muted-foreground">
          <li>
            <Link href="/admin/ai/human-ops" className="underline-offset-2 hover:underline">
              Human Operations
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{reviewId}</li>
        </ol>
      </nav>
      <HumanOpsReviewDetail
        initialReview={formatReviewForOperator(item)}
        initialAudit={listHumanOpsAuditForReview(reviewId)}
      />
    </div>
  );
}
