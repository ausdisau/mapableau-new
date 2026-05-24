import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listPasskeys } from "@/lib/auth/passkeys/passkey-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";

export const metadata = { title: "Passkeys | Security" };

export default async function PasskeysSettingsPage() {
  const user = await requireAuth();
  const passkeys =
    remainingSystemsConfig.passkeysEnabled
      ? await listPasskeys(user.id).catch(() => [])
      : [];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Passkeys</h1>
      <p className="text-sm">
        A passkey lets you sign in with your device lock, fingerprint, face, or security key.
      </p>
      {!remainingSystemsConfig.passkeysEnabled ? (
        <p className="text-sm text-muted-foreground">Passkeys are not enabled in this environment.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {passkeys.length === 0 ? (
            <li className="p-4 text-sm">No passkeys registered yet.</li>
          ) : (
            passkeys.map((p) => (
              <li key={p.id} className="p-4 text-sm">
                {p.deviceName ?? "Passkey"} — added {p.createdAt.toLocaleDateString()}
              </li>
            ))
          )}
        </ul>
      )}
      <Link href="/login" className="text-sm text-primary underline">
        Sign in with email instead
      </Link>
    </main>
  );
}
