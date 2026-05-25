import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

export default async function BookingsRedirectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/bookings");
  redirect("/dashboard/bookings");
}
