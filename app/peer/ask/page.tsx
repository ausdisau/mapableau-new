import { AskPeerQuestionForm, PeerBoundaryNotice } from "@/components/peer";

export default function PeerAskPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Ask the community</h1>
      <PeerBoundaryNotice />
      <AskPeerQuestionForm />
    </div>
  );
}
