import { PublicShell } from "@/components/core/PublicShell";


export const dynamic = "force-dynamic";

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
