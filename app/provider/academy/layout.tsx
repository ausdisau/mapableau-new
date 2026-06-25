import { CoreShell } from "@/components/core/CoreShell";

export default function ProviderAcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
