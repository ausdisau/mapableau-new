import { redirect } from "next/navigation";

/** Canonical alias → participant dashboard chrome. */
export default function TransportDashboardAliasPage() {
  redirect("/dashboard/transport");
}
