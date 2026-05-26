import { CoreShell } from "@/components/core/CoreShell";

/** Standard layout for civic / account surfaces that use CoreShell. */
export async function CoreModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
