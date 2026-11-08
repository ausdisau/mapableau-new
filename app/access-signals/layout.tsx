import { notFound } from "next/navigation";

import { isAccessSignalsEnabled } from "@/lib/access/signals/flags";
import { isAccessSignalsDemoEnabled } from "@/lib/access-signals/policy";

export default function AccessSignalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAccessSignalsEnabled() && !isAccessSignalsDemoEnabled()) {
    notFound();
  }
  return children;
}
