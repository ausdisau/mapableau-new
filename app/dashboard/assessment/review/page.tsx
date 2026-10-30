import { redirect } from "next/navigation";

import { AssessmentReviewWorkspace } from "@/components/assessment/AssessmentReviewWorkspace";
import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";
import { isAssessmentRegistrationEnabled } from "@/lib/config/assessment-release";

export const metadata = { title: "Review assessor findings | MapAble" };
export default async function ReviewPage() {
 const user = await requireAuth();
 if (user.primaryRole !== "participant" && !user.roles.includes("participant")) redirect(defaultDashboardPath(user.primaryRole));
 if (!isAssessmentRegistrationEnabled()) redirect("/dashboard");
 return <AssessmentReviewWorkspace />;
}
