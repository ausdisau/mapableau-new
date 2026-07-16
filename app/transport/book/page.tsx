import { redirect } from "next/navigation";

/** Compatibility alias → canonical request flow. */
export default function TransportBookCompatPage() {
  redirect("/transport/request");
}
