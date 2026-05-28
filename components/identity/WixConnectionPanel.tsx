import Link from "next/link";

import { getWixAdminStatus } from "@/lib/auth/wix/wix-admin-adapter";

export async function WixConnectionPanel() {
  const status = await getWixAdminStatus();
  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Wix Headless identity</h2>
      <p className="mt-2 text-sm text-muted-foreground">{status.message}</p>
      <p className="mt-2 text-xs">
        Wix authenticates site members only. MapAble accounts must already exist
        with a matching email, or a pending link is created when required.
      </p>
      {status.enabled && status.configured ? (
        <Link
          href="/api/auth/wix/login"
          className="mt-4 inline-block text-sm text-primary underline"
        >
          Test Wix login
        </Link>
      ) : null}
    </section>
  );
}
