import { Suspense } from "react";

import { ShiftCreatorPageClient } from "@/app/provider/care/shift-creator/ShiftCreatorPageClient";
import { requirePermission } from "@/lib/auth/guards";

export default async function ProviderShiftCreatorPage() {
  await requirePermission("care:manage:org");

  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading…</p>}>
      <ShiftCreatorPageClient />
    </Suspense>
  );
}
