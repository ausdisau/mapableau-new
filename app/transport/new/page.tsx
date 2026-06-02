import { redirect } from "next/navigation";

/** Canonical book-trip flow lives under the dashboard shell. */
export default function TransportBookRedirectPage() {
  redirect("/dashboard/transport/new");
}
