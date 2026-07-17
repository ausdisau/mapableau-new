import { redirect } from "next/navigation";

/** Compatibility redirect — console lives under /admin/accountability. */
export default function NationalAccountabilityAdminRedirectPage() {
  redirect("/admin/accountability");
}
