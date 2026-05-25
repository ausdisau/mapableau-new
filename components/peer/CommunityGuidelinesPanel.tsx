type Props = { easyRead?: boolean };

export function CommunityGuidelinesPanel({ easyRead = false }: Props) {
  if (easyRead) {
    return (
      <section aria-labelledby="guidelines-easy-heading" className="space-y-3">
        <h2 id="guidelines-easy-heading" className="text-lg font-semibold">
          Community rules (Easy Read)
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-base">
          <li>Be kind. No bullying.</li>
          <li>Keep your private details safe.</li>
          <li>Do not give medical or legal advice.</li>
          <li>Use Report if something feels unsafe.</li>
          <li>No follower counts or popularity games here.</li>
        </ul>
      </section>
    );
  }

  return (
    <section aria-labelledby="guidelines-heading" className="space-y-3">
      <h2 id="guidelines-heading" className="text-lg font-semibold">
        Community guidelines
      </h2>
      <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
        <li>Respect lived experience; no harassment or discrimination.</li>
        <li>Protect privacy - do not share others' contact details.</li>
        <li>Share experience, not professional clinical, legal, or financial advice.</li>
        <li>Report unsafe content; moderators review - not AI-only decisions.</li>
        <li>No followers, public likes, or popularity leaderboards.</li>
      </ul>
    </section>
  );
}
