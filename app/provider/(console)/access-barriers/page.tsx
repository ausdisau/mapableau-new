import { redirect } from "next/navigation";

/** Legacy path — Access barriers live under Care to keep top-level hubs ≤ 10. */
export default function ProviderAccessBarriersRedirectPage() {
  redirect("/provider/care/access-barriers");
}
