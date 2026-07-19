import { Suspense } from "react";

import { MagicLinkClient } from "@/app/login/magic/MagicLinkClient";

export const metadata = {
  title: "Email sign-in | MapAble",
};

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-muted-foreground" role="status">
          Completing email sign-in…
        </p>
      }
    >
      <MagicLinkClient />
    </Suspense>
  );
}
