import { PublicKnowledgeClient } from "@/components/public/PublicKnowledgeClient";
import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Public knowledge | MapAble",
  description:
    "Ask questions grounded only in MapAble material deliberately published to the public knowledge namespace.",
  alternates: canonicalAlternate("/knowledge"),
};

export default async function PublicKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuestion = Array.isArray(params.q) ? params.q[0] : params.q;
  const initialQuestion = rawQuestion?.trim().slice(0, 1200) ?? "";

  const rateLimitVerified =
    process.env.MAPABLE_PUBLIC_RATE_LIMIT_VERIFIED === "true";
  const enabled =
    rateLimitVerified &&
    process.env.MAPABLE_PUBLIC_KNOWLEDGE_ENABLED === "true";
  const ttsEnabled =
    enabled &&
    process.env.MAPABLE_PUBLIC_TTS_ENABLED === "true" &&
    Boolean(process.env.SPEECHIFY_API_KEY?.trim()) &&
    Boolean(process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET?.trim());

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">Public knowledge</p>
      <h1 className="mapable-display mt-2 text-4xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-5xl">
        Ask what MapAble has published.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        This guide answers from material deliberately published under MapAble’s
        public knowledge namespace. It does not expose participant records,
        private project files, credentials, internal prompts, bookings, payments
        or administrative systems.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Do not enter personal, health, NDIS-plan, financial or identity
        information here. Questions use MapAble’s configured AI service. If you
        choose Listen, the displayed answer text is sent to Speechify to generate
        audio.
      </p>
      <div className="mt-8">
        <PublicKnowledgeClient
          enabled={enabled}
          ttsEnabled={ttsEnabled}
          initialQuestion={initialQuestion}
        />
      </div>
    </div>
  );
}
