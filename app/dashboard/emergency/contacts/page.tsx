import Link from "next/link";

import { TrustedContactForm } from "@/components/emergency/TrustedContactForm";
import { requirePermission } from "@/lib/auth/guards";
import { getEmergencyProfile } from "@/lib/emergency/profile-service";

export default async function EmergencyContactsPage() {
  const user = await requirePermission("emergency:manage:self");
  const profile = await getEmergencyProfile(user.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <h1 className="font-heading text-2xl font-bold">Trusted contacts</h1>
      <ul className="space-y-2">
        {(profile?.contacts ?? []).map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-border p-4 flex justify-between gap-2"
          >
            <div>
              <span className="font-medium">
                {c.name}
                {c.isPrimary ? " (primary)" : ""}
              </span>
              <p className="text-sm text-muted-foreground">
                {c.phone ?? "No phone"} · {c.relationship ?? "Contact"}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <TrustedContactForm />
    </div>
  );
}
