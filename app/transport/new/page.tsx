import { redirect } from "next/navigation";

/** Compatibility: book-trip flow now lives at /transport/request. */
export default function TransportNewRedirectPage() {
  redirect("/transport/request");
}
