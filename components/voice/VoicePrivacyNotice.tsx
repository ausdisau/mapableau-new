export function VoicePrivacyNotice() {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
      aria-labelledby="voice-privacy-heading"
    >
      <h3 id="voice-privacy-heading" className="font-semibold">
        Voice privacy
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Voice is optional. You can type or paste text instead.</li>
        <li>Audio is deleted after transcription by default.</li>
        <li>Only the transcript is kept unless you consent to store audio.</li>
        <li>Third-party speech services are used only if you enable them in settings.</li>
        <li>Voice creates drafts only — you must review and submit yourself.</li>
      </ul>
    </aside>
  );
}
