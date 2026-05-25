import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import { hasValidStepUp } from "@/lib/auth/step-up/step-up-service";
import type { StepUpActionKey } from "@/lib/auth/step-up/step-up-policy";

export async function requireStepUp(
  user: CurrentUser,
  actionKey: StepUpActionKey
): Promise<Response | null> {
  const valid = await hasValidStepUp(user.id, actionKey);
  if (!valid) {
    return apiForbidden(`Step-up authentication required: ${actionKey}`);
  }
  return null;
}
