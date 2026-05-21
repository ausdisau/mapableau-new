import { CoreShell } from "@/components/core/CoreShell";

export default function CorePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
