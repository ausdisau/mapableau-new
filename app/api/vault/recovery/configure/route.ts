import { requireApiPermission } from "@/lib/api/auth-handler";
import { vaultErrorResponse, vaultOk } from "@/lib/vault/http";
import { configureRecovery } from "@/lib/vault/recovery";

export async function POST(req: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  try {
    const body = await req.json();
    const configuration = await configureRecovery({
      ownerUserId: user.id,
      method: body.method ?? "threshold",
      thresholdJson: body.thresholdJson ?? {
        required: ["participant", "trusted_contact", "rights_officer"],
      },
      accessibleNotes: body.accessibleNotes,
    });
    return vaultOk({ configuration }, 201);
  } catch (error) {
    return vaultErrorResponse(error);
  }
}
