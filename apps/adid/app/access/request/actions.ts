"use server";
import { redirect } from "next/navigation";
import { requireAccessPrincipal } from "../../../lib/access-principal";
import {
  requestDatabase,
  selectedServices,
  submitRequests,
} from "../../../lib/access-requests";

export async function submitAccessRequest(form: FormData) {
  const who = await requireAccessPrincipal();
  const services = selectedServices(form.getAll("services"));
  if (!services.length) redirect("/access/request?state=choose");
  try {
    const db = requestDatabase();
    if (!db) throw new Error();
    await submitRequests(db, who, services);
  } catch {
    redirect("/access/request?state=unavailable");
  }
  redirect("/access/request/confirmation");
}
