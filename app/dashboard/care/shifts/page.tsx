import { redirect } from "next/navigation";

import { routes } from "@/lib/routing/canonical-routes";

export default function DashboardCareShiftsRedirect() {
  redirect(routes.care.shifts);
}
