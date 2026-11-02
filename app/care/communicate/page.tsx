import { CareCommunicateClient } from "@/components/adtunis/CareCommunicateClient";
import { requireAuth } from "@/lib/auth/guards";
import { getPassportForParticipant } from "@/lib/communication/communication-passport-service";
import { adtunisConfig } from "@/lib/config/adtunis";
import { mobileCommunicationConfig } from "@/lib/config/mobile-communication";
import type { AacPhrase } from "@mapable/adtunis-aac";
import { DEFAULT_CARE_AAC_PHRASES } from "@mapable/adtunis-aac";

export const metadata = {
  title: "Care communicate | MapAble",
  description:
    "Compose a Care message with speech, typing or AAC. Nothing is sent until you confirm.",
};

export default async function CareCommunicatePage() {
  const user = await requireAuth();

  if (!adtunisConfig.enabled) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Care communicate</h1>
        <p role="status" className="rounded-lg border border-dashed p-4 text-sm">
          Adtunis communication is not enabled in this environment. Set
          MAPABLE_ADTUNIS_ENABLED=true to use this participant-controlled
          composer.
        </p>
      </main>
    );
  }

  let phrases: AacPhrase[] = DEFAULT_CARE_AAC_PHRASES;
  if (mobileCommunicationConfig.aacCommunicationEnabled) {
    try {
      const passport = await getPassportForParticipant(user.id);
      const saved = (passport?.savedPhrases ?? []).map((phrase) => ({
        id: phrase.id,
        text: phrase.text,
        category: phrase.category ?? "passport",
      }));
      if (saved.length) phrases = saved;
    } catch {
      phrases = DEFAULT_CARE_AAC_PHRASES;
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Care communicate</h1>
        <p className="text-muted-foreground">
          Use speech, typing or AAC to draft a Care message. Recognition
          candidates stay editable. Delivery requires your explicit confirmation
          and never happens automatically from uncertain speech.
        </p>
        {adtunisConfig.messagingMode === "mock" ? (
          <p className="rounded-md border border-amber-600/40 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Messaging mode is mock. Confirmed messages are labelled as simulated
            delivery and are not presented as real sends.
          </p>
        ) : null}
      </header>
      <CareCommunicateClient initialPhrases={phrases} />
    </main>
  );
}
