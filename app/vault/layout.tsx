import { CoreShell } from "@/components/core/CoreShell";

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
