import { requireApiPermission } from "@/lib/api/auth-handler";
import { fedJson } from "@/lib/api/federation-response";
import { getOrDraftVault, updatePrivacyDefaults } from "@/lib/access-vault/vault";
import { z } from "zod";

const updateSchema = z.object({
  privacyModeDefault: z.enum(["minimum_necessary", "strict", "open"]).optional(),
  externalIssuanceOptIn: z.boolean().optional(),
  notes: z.string().nullish(),
});

export async function GET() {
  const user = await requireApiPermission("vault:read:self");
  if (user instanceof Response) return user;
  const vault = await getOrDraftVault(user.id);
  return fedJson({ vault });
}

export async function PATCH(request: Request) {
  const user = await requireApiPermission("vault:manage:self");
  if (user instanceof Response) return user;
  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return fedJson({ error: "validation_failed" }, 400);
  }
  const vault = await updatePrivacyDefaults(user.id, user.id, parsed.data);
  return fedJson({ vault });
}
