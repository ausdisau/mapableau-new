import { requireParticipantShell } from "@/lib/layouts/require-participant-shell";

export default async function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return requireParticipantShell(children);
}
