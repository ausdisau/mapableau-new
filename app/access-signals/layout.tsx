import { notFound } from "next/navigation";

import { isAccessSignalsDemoEnabled } from "@/lib/access-signals/policy";

export default function AccessSignalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAccessSignalsDemoEnabled()) notFound();
  return children;
}
