import Link from "next/link";

import { ParticipantInformationVault } from "@/components/privacy/ParticipantInformationVault";
import { requireAuth } from "@/lib/auth/guards";
import { phase2Config } from "@/lib/config/phase2";
import { isParticipantInformationVaultEnabled } from "@/lib/privacy/participant-vault/flags";
import { listVaultItems } from "@/lib/privacy/participant-vault/service";

export const metadata = {
  title: "Information vault | MapAble",
  description: "Keep and share your identity documents, plans and agreements.",
};

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await requireAuth();
  const enabled = isParticipantInformationVaultEnabled();

  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-bold">Information vault</h1>
        <p>The information vault is disabled in this environment.</p>
        <p className="text-sm text-muted-foreground">
          Platform export and deletion requests stay on{" "}
          <Link href="/data-vault" className="text-primary underline">
            Export and deletion
          </Link>
          .
        </p>
      </div>
    );
  }

  const { items, uploadsAvailable } = await listVaultItems(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Information vault</h1>
      <p className="text-muted-foreground">
        A locker for artefacts you own. This is not Access Passport, and it is not
        a platform export.
      </p>
      <ParticipantInformationVault
        initialItems={items}
        uploadsAvailable={uploadsAvailable}
        maxUploadMb={phase2Config.documentMaxUploadMb}
      />
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to control panel
      </Link>
    </div>
  );
}
