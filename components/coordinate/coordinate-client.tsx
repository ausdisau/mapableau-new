"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CoordinateParticipantSelector({
  participants,
}: {
  participants: Array<{ participantId: string; participantName: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("participantId");

  if (participants.length === 0) return null;

  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm font-medium">Select participant</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {participants.map((p) => (
          <Button
            key={p.participantId}
            variant={current === p.participantId ? "default" : "outline"}
            size="default"
            className="min-h-11"
            onClick={() =>
              router.push(`/coordinate?participantId=${p.participantId}`)
            }
          >
            {p.participantName}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function participantQuery(participantId?: string | null) {
  return participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
}

async function coordinateFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export { coordinateFetch };
