import { redirect } from "next/navigation";

/** Prefer the published map at `/access`; keep this path as a stable alias. */
export default function AccessMapAliasPage() {
  redirect("/access");
}
