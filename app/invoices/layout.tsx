import { requireParticipantShell } from "@/lib/layouts/require-participant-shell";

export default async function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return requireParticipantShell(children);
}
