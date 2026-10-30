import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";

export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().trim().min(2).max(500),
  preferences: z.object({
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).optional(),
    postcode: z.string().regex(/^\d{4}$/).optional(),
    service: z.string().max(100).optional(),
    communication: z.enum(["AAC", "Text", "Auslan", "No preference"]).optional(),
    usePreferences: z.boolean().default(false),
  }).default({ usePreferences: false }),
});

const stateNames: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
  SA: "South Australia", WA: "Western Australia", TAS: "Tasmania",
  ACT: "Australian Capital Territory", NT: "Northern Territory",
};
const services = [
  "Support Coordination", "Therapeutic Supports", "Assistance with Daily Life",
  "Community Participation", "Transport", "Employment Supports",
  "Assistive Technology", "Home Modifications",
];

function extractLocation(input: string) {
  const postcode = input.match(/\b\d{4}\b/)?.[0];
  const state = Object.keys(stateNames).find((code) =>
    new RegExp(`\\b${code}\\b`, "i").test(input) ||
    input.toLowerCase().includes(stateNames[code].toLowerCase()),
  );
  return { postcode, state };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to search with chat" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid search request" }, { status: 400 });

  const { message, preferences } = parsed.data;
  const location = extractLocation(message);
  const requestedService = services.find((service) =>
    message.toLowerCase().includes(service.toLowerCase()),
  );
  const effectiveState = location.state ?? (preferences.usePreferences ? preferences.state : undefined);
  const effectivePostcode = location.postcode ?? (preferences.usePreferences ? preferences.postcode : undefined);
  const effectiveService = requestedService ?? (preferences.usePreferences ? preferences.service : undefined);

  // An individual-worker directory or authorised screening-status interface is not connected.
  const workerIntent = /\b(worker|workers|carer|carers|support person|screening|clearance)\b/i.test(message);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: unknown) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        emit({ type: "status", text: "Searching MapAble's imported NDIS provider records…" });
        const result = await searchNdisProviders({
          state: effectiveState,
          postcode: effectivePostcode,
          // Exact service tags only: do not turn fuzzy wording into a false negative.
          limit: 25,
          withCoordinatesOnly: false,
        });
        const matches = effectiveService
          ? result.providers.filter((row) =>
              [...row.services, ...row.registration_groups].some((item) =>
                item.toLowerCase().includes(effectiveService.toLowerCase()),
              ),
            )
          : result.providers;
        const ranked = matches.slice(0, 12);
        const intro = workerIntent
          ? "Worker-level search is not connected to an authorised directory. These are provider organisations, not verified individual workers. "
          : "";
        emit({
          type: "message",
          text: intro + (ranked.length
            ? `Found ${ranked.length} provider records matching the available filters. Directory entries require fresh registration and availability checks.`
            : "No provider records matched this query. Try a state or postcode, or adjust your service preference."),
        });
        emit({
          type: "context",
          applied: { state: effectiveState ?? null, postcode: effectivePostcode ?? null, service: effectiveService ?? null },
          personalised: preferences.usePreferences,
          communication: preferences.usePreferences ? preferences.communication ?? null : null,
          note: "Communication preference is not proof that any returned provider can accommodate it.",
        });
        for (const row of ranked) {
          emit({
            type: "provider",
            provider: {
              id: row.source_id,
              name: row.provider_name,
              suburb: row.suburb,
              state: row.state,
              postcode: row.postcode,
              services: row.services,
              latitude: row.latitude,
              longitude: row.longitude,
              sourceUpdatedAt: row.updated_at,
              evidence: "Imported NDIS provider record; current registration not reverified",
              workerScreening: "Not independently verified",
            },
          });
        }
        emit({ type: "complete", count: ranked.length });
      } catch {
        emit({ type: "error", text: "Search unavailable. No results were verified." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
