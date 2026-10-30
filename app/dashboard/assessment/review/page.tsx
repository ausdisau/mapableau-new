import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { AssessmentReviewWorkspace } from "@/components/assessment/AssessmentReviewWorkspace";
export const metadata = { title: "Review assessor findings | MapAble" };
export default async function ReviewPage() {
 const user = await requireAuth();
 if (user.primaryRole !== "participant" && !user.roles.includes("participant")) redirect(defaultDashboardPath(user.primaryRole));
 return <AssessmentReviewWorkspace />;
}
