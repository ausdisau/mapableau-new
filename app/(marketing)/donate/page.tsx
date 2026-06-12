import { Suspense } from "react";

import { DonatePageClient } from "@/components/marketing/DonatePageClient";

export const metadata = {
  title: "Donate | MapAble",
  description:
    "Support Australian Disability Ltd and MapAble with a one-off donation via card or PayPal.",
};

export default function DonatePage() {
  return (
    <Suspense fallback={null}>
      <DonatePageClient />
    </Suspense>
  );
}
