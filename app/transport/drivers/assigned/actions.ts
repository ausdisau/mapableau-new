"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import {
  changeAssignedTrip,
  fieldCommand,
  isFieldConflict,
} from "@/lib/transport/driver-roster";
import { TransportApiError } from "@/lib/transport/transport-api-error";
const path = "/transport/drivers/assigned";
export async function submitDriverCommand(form: FormData) {
  const user = await requireAuth();
  const result = fieldCommand.safeParse({
    assignment: form.get("assignment"),
    revision: form.get("revision"),
    expected: form.get("expected"),
    kind: form.get("kind"),
    confirmations: form.getAll("confirm"),
  });
  let outcome = "invalid";
  if (result.success) {
    try {
      await changeAssignedTrip(user, result.data);
      outcome = "saved";
    } catch (e) {
      outcome = isFieldConflict(e)
        ? "review"
        : e instanceof TransportApiError
          ? "eligibility"
          : "unconfirmed";
    }
  }
  revalidatePath(path);
  redirect(path + "?result=" + outcome);
}
