import { redirect } from "next/navigation";
/** Historic entry point retained for old bookmarks. */
export default function LegacySupportNeedsRegistration() {
  redirect("/register/assessment");
}
