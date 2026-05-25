import { requireParticipantShell } from "@/lib/layouts/require-participant-shell";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return requireParticipantShell(children);
}
