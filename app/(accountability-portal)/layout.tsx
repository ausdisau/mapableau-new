import { AccountabilityPublicShell } from "@/components/accountability/AccountabilityPublicShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountabilityPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountabilityPublicShell>{children}</AccountabilityPublicShell>;
}
