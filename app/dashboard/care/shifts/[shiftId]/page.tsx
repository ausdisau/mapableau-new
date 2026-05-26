import { redirect } from "next/navigation";

import { routes } from "@/lib/routing/canonical-routes";

export default async function DashboardCareShiftDetailRedirect({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  redirect(routes.care.shift(shiftId));
}
