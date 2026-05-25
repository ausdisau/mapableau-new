import { CoreShell } from "@/components/core/CoreShell";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
