import { redirect } from "next/navigation";

export default function EmploymentRedirect() {
  redirect("/dashboard/jobs");
}
