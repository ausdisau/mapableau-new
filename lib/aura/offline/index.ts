import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import { requireMission, saveMission } from "../mission/store";
import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";

export type AuraOfflineVisitPack = {
  id: string;
  missionId: string;
  planId: string;
  planVersion: number;
  place: { id: string; name: string; address: string };
  destination: string;
  visitAt?: string;
  route: {
    entrance: string;
    orderedInstructions: string[];
    distanceMetres?: number;
    estimatedMinutes?: number;
  } | null;
  fallbackRoute?: { label: string; orderedInstructions: string[] };
  confirmed: string[];
  conditions: string[];
  unknowns: string[];
  blockers: string[];
  liveSnapshot: {
    capturedAt: string;
    incidents: string[];
    reliability: number;
  };
  evidenceDates: Array<{ label: string; observedAt: string }>;
  nonAiRoutes: Array<{ label: string; hrefOrInstruction: string }>;
  generatedAt: string;
  staleAfter: string;
  status:
    | "current_snapshot"
    | "stale_snapshot"
    | "superseded"
    | "mission_stopped"
    | "deleted";
  excludedByDefault: string[];
};

const packs = new Map<string, AuraOfflineVisitPack>();

export function resetOfflinePackStore(): void {
  packs.clear();
}

export function createOfflineVisitPack(input: {
  missionId: string;
  userId: string;
  includeOptional?: string[];
}): AuraOfflineVisitPack {
  if (!auraFlags.offlinePacks && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_OFFLINE_PACKS_DISABLED");
  }
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (!mission.plan) throw new Error("AURA_PLAN_MISSING");

  const generatedAt = new Date().toISOString();
  const staleAfter = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const route = mission.plan.recommendedRoute;

  const pack: AuraOfflineVisitPack = {
    id: randomUUID(),
    missionId: mission.id,
    planId: mission.plan.id,
    planVersion: mission.planVersions.length + 1,
    place: {
      id: mission.placeId,
      name: "Harbour Civic Centre (synthetic demo)",
      address: "100 Synthetic Quay, Demo Harbour NSW 2000",
    },
    destination: "Interview Room 3.12",
    visitAt: "tomorrow 10:00 (arrive 09:45)",
    route: route
      ? {
          entrance: route.entranceLabel ?? "Entrance B",
          orderedInstructions: [
            `Arrive at accessible drop-off.`,
            `Enter via ${route.entranceLabel ?? "Entrance B"} (level).`,
            `Use ${route.liftLabel ?? "western lift"} to level 3.`,
            `Proceed to Room 3.12.`,
            ...(route.stepIds ?? []).map(
              (id, i) => `Step ${i + 1} node: ${id}`,
            ),
          ],
          distanceMetres: undefined,
          estimatedMinutes: undefined,
        }
      : null,
    fallbackRoute: {
      label: "No verified lift fallback while main lift is out",
      orderedInstructions: [
        "If western lift fails: do not use Entrance A (steps).",
        "Contact venue for special access or reschedule via standard MapAble services.",
      ],
    },
    confirmed: mission.knownFacts.slice(0, 8),
    conditions: mission.conditions,
    unknowns: mission.unknowns,
    blockers: mission.blockers,
    liveSnapshot: {
      capturedAt: generatedAt,
      incidents: ["Main lift unavailable (Living Twin simulation)"],
      reliability: 0.65,
    },
    evidenceDates: (mission.plan.evidence ?? []).slice(0, 8).map((e) => ({
      label: e.evidenceId,
      observedAt: e.observedAt,
    })),
    nonAiRoutes: [
      { label: "Access map", hrefOrInstruction: "/access" },
      {
        label: "Visit plans",
        hrefOrInstruction: "/access-intelligence/visit-plans",
      },
      { label: "Verify my venue", hrefOrInstruction: "/verify-my-venue" },
    ],
    generatedAt,
    staleAfter,
    status: "current_snapshot",
    excludedByDefault: [
      "diagnosis",
      "full_access_passport",
      "medical_notes",
      "funding_data",
      "unrelated_journey_history",
    ],
  };

  packs.set(pack.id, pack);
  appendWitness({
    missionId: mission.id,
    type: "offline_pack.created",
    summary: "Offline Visit Pack created (data-minimised snapshot)",
    correlationId: mission.correlationId,
    payload: {
      packId: pack.id,
      generatedAt,
      excluded: pack.excludedByDefault,
    },
  });

  return pack;
}

export function listOfflinePacks(missionId: string): AuraOfflineVisitPack[] {
  return [...packs.values()]
    .filter((p) => p.missionId === missionId && p.status !== "deleted")
    .map(applyStalePolicy);
}

export function getOfflinePack(packId: string): AuraOfflineVisitPack | null {
  const pack = packs.get(packId);
  if (!pack || pack.status === "deleted") return null;
  return applyStalePolicy(pack);
}

export function deleteOfflinePack(input: {
  missionId: string;
  packId: string;
  userId: string;
}): void {
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.userId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  const pack = packs.get(input.packId);
  if (!pack || pack.missionId !== input.missionId) {
    throw new Error("AURA_OFFLINE_PACK_NOT_FOUND");
  }
  packs.set(input.packId, { ...pack, status: "deleted" });
  appendWitness({
    missionId: input.missionId,
    type: "offline_pack.deleted",
    summary: "Offline Visit Pack deleted",
    correlationId: mission.correlationId,
    payload: { packId: input.packId },
  });
}

function applyStalePolicy(pack: AuraOfflineVisitPack): AuraOfflineVisitPack {
  if (pack.status === "deleted") return pack;
  const mission = requireMission(pack.missionId);
  if (mission.stopState || mission.status === "stopped") {
    return { ...pack, status: "mission_stopped" };
  }
  if (Date.parse(pack.staleAfter) <= Date.now()) {
    return { ...pack, status: "stale_snapshot" };
  }
  return pack;
}

/**
 * Accessible standalone HTML — core content works without JavaScript.
 */
export function renderOfflinePackHtml(pack: AuraOfflineVisitPack): string {
  const staleWarning =
    pack.status === "stale_snapshot" || pack.status === "mission_stopped"
      ? `<p role="status"><strong>Warning:</strong> This is a saved snapshot from ${pack.generatedAt}. Live lift, entrance, transport and venue conditions may have changed.</p>`
      : `<p role="status">This is a saved snapshot from ${pack.generatedAt}. Live conditions may change after this time.</p>`;

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8"/>
<title>Offline Visit Pack — ${escapeHtml(pack.place.name)}</title>
<style>
body{font-family:system-ui,sans-serif;line-height:1.5;max-width:40rem;margin:1rem auto;padding:0 1rem;color:#111;background:#fff}
h1,h2{font-weight:700} ul{padding-left:1.25rem} .warn{border:2px solid #92400e;background:#fffbeb;padding:.75rem}
@media print{a[href]::after{content:""}}
</style>
</head>
<body>
<header>
<h1>Offline Visit Pack</h1>
<p>${escapeHtml(pack.place.name)} — ${escapeHtml(pack.destination)}</p>
${staleWarning}
</header>
<main>
<section>
<h2>Route</h2>
${
  pack.route
    ? `<p>Entrance: ${escapeHtml(pack.route.entrance)}</p><ol>${pack.route.orderedInstructions
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ol>`
    : "<p>No route available.</p>"
}
</section>
<section>
<h2>Fallback</h2>
${
  pack.fallbackRoute
    ? `<p>${escapeHtml(pack.fallbackRoute.label)}</p><ol>${pack.fallbackRoute.orderedInstructions
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ol>`
    : "<p>None verified.</p>"
}
</section>
<section>
<h2>Unknowns</h2>
<ul>${pack.unknowns.map((u) => `<li>${escapeHtml(u)}</li>`).join("") || "<li>None</li>"}</ul>
</section>
<section>
<h2>Conditions</h2>
<ul>${pack.conditions.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
</section>
<section>
<h2>Evidence dates</h2>
<ul>${pack.evidenceDates
    .map((e) => `<li>${escapeHtml(e.label)} — ${escapeHtml(e.observedAt)}</li>`)
    .join("")}</ul>
</section>
<section>
<h2>Live snapshot at generation</h2>
<p>Captured: ${escapeHtml(pack.liveSnapshot.capturedAt)}</p>
<ul>${pack.liveSnapshot.incidents.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
</section>
<section>
<h2>Standard non-AI actions</h2>
<ul>${pack.nonAiRoutes
    .map(
      (r) =>
        `<li>${escapeHtml(r.label)}: ${escapeHtml(r.hrefOrInstruction)}</li>`,
    )
    .join("")}</ul>
</section>
<section>
<h2>Privacy</h2>
<p>Excluded by default: ${pack.excludedByDefault.map(escapeHtml).join(", ")}.</p>
<p>Delete this file from shared devices after use.</p>
</section>
</main>
<footer>
<p>Plan ${escapeHtml(pack.planId)} v${pack.planVersion}. Status: ${escapeHtml(pack.status)}.</p>
<p>Emergency: follow your usual emergency procedures. This pack is not a live monitoring service.</p>
</footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Mark packs stopped when mission stops. */
export function markPacksStopped(missionId: string): void {
  for (const [id, pack] of packs) {
    if (pack.missionId === missionId && pack.status !== "deleted") {
      packs.set(id, { ...pack, status: "mission_stopped" });
    }
  }
  void saveMission;
}
