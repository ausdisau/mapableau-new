import { PublicShell } from "@/components/core/PublicShell";

export const metadata = {
  title: "Provider Finder | MapAble",
  description:
    "Find disability support, transport, therapy and employment providers with access needs and funding filters.",
};

export default function ProviderFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
