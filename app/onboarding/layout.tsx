import { CoreShell } from "@/components/core/CoreShell";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
