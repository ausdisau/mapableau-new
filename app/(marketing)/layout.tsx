import { PublicShell } from "@/components/core/PublicShell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
