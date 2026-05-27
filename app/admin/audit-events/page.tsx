import { redirect } from "next/navigation";

export default function AuditEventsRedirect() {
  redirect("/admin/audit");
}
