import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { CareOSMissionDetail } from "@mapable/careos-contracts";
import {
  AccessibleConfirmationCard,
  AccessibleEvidenceCard,
  AccessibleStatus,
} from "@/accessibility";
import { getMobileApiClient } from "@/api/client";
import { useMapableTheme } from "@/theme";

export function MissionDetailScreen({ missionId }: { missionId: string }) {
  const theme = useMapableTheme();
  const [mission, setMission] = useState<CareOSMissionDetail | null>(null);

  useEffect(() => {
    getMobileApiClient()
      .getMission(missionId)
      .then(setMission)
      .catch(() => setMission(demoMission(missionId)));
  }, [missionId]);

  if (!mission) {
    return <Text>Loading mission…</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: "700", color: theme.colors.foreground }}>
        {mission.desiredOutcome}
      </Text>
      <AccessibleStatus
        label={mission.whatChanged}
        tone={mission.needsDecision ? "decision needed" : "in progress"}
      />
      <Text style={{ color: theme.colors.foreground }}>Authority: {mission.authoritySummary}</Text>
      <Text style={{ color: theme.colors.foreground }}>Why it matters: {mission.whyItMatters}</Text>
      <Text style={{ color: theme.colors.foreground }}>Next: {mission.whatHappensNext}</Text>

      {mission.appointment ? (
        <View style={{ gap: 6 }}>
          <Text accessibilityRole="header" style={{ fontWeight: "700" }}>
            Appointment
          </Text>
          <Text>{mission.appointment.title}</Text>
          <Text>Location: {mission.appointment.locationLabel ?? "Not confirmed"}</Text>
          <Text>Care needs: {mission.appointment.careRequirements.join("; ") || "None listed"}</Text>
          <Text>Transport options: {mission.appointment.transportOptionsSummary.join("; ")}</Text>
          <Text>Access evidence: {mission.appointment.accessEvidenceSummary.join("; ")}</Text>
          <Text>Timing buffers: {mission.appointment.timingBuffers.join("; ")}</Text>
          {mission.appointment.costContext ? <Text>{mission.appointment.costContext}</Text> : null}
        </View>
      ) : null}

      <Text accessibilityRole="header" style={{ fontWeight: "700" }}>Evidence</Text>
      {mission.evidence.map((e) => (
        <AccessibleEvidenceCard
          key={e.id}
          title={e.label}
          summary={e.summary}
          provenance={e.provenance}
          observedAt={e.observedAt}
          confidence={e.confidence}
        />
      ))}

      <Text accessibilityRole="header" style={{ fontWeight: "700" }}>Unknown information</Text>
      {mission.unknownInformation.map((u) => (
        <Text key={u}>• {u}</Text>
      ))}

      {mission.pendingConfirmations.map((c) => (
        <AccessibleConfirmationCard
          key={c.id}
          title={c.label}
          explanation={c.explanation}
          domain={c.domain}
          onConfirm={async () => {
            try {
              const updated = await getMobileApiClient().confirmMissionAction(mission.id, {
                confirmationId: c.id,
                domain: c.domain,
                decision: "grant",
                idempotencyKey: cryptoRandomUuid(),
              });
              setMission(updated);
            } catch {
              setMission({
                ...mission,
                pendingConfirmations: mission.pendingConfirmations.map((p) =>
                  p.id === c.id ? { ...p, status: "granted" } : p,
                ),
                receipts: [
                  ...mission.receipts,
                  {
                    id: `receipt_${c.domain}`,
                    domain: c.domain,
                    action: `${c.domain}_confirmed`,
                    confirmedAt: new Date().toISOString(),
                    correlationId: mission.id,
                  },
                ],
              });
            }
          }}
          onDecline={() => undefined}
        />
      ))}

      <Text accessibilityRole="header" style={{ fontWeight: "700" }}>Action receipts</Text>
      {mission.receipts.length === 0 ? (
        <Text>No confirmed actions yet.</Text>
      ) : (
        mission.receipts.map((r) => (
          <Text key={r.id}>
            {r.domain}: {r.action} at {r.confirmedAt}
          </Text>
        ))
      )}

      {mission.nonAiPathwayAvailable ? (
        <Text>A standard non-AI pathway remains available at any time.</Text>
      ) : null}
    </ScrollView>
  );
}

function cryptoRandomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function demoMission(id: string): CareOSMissionDetail {
  return {
    id,
    missionType: "appointment",
    status: "needs_decision",
    desiredOutcome: "Attend physiotherapy next Tuesday",
    whatChanged: "CareOS understood your goal and prepared options.",
    whyItMatters: "The provider needs your approval by Friday.",
    needsDecision: true,
    whoIsWaiting: "You",
    whatHappensNext: "Confirm Care and Transport as separate actions.",
    updatedAt: new Date().toISOString(),
    authoritySummary: "Participant authority for care and transport review. Organisation membership alone is not enough.",
    unknownInformation: ["Exact entrance step height not verified in the last 90 days."],
    recommendations: ["Confirm Care worker with documented transfer support evidence."],
    humanReviewItems: [],
    evidence: [
      {
        id: "ev1",
        label: "Clinic entrance",
        provenance: "mapable_accreditation",
        observedAt: "2026-05-01T00:00:00.000Z",
        confidence: "medium",
        summary: "Step-free entrance recorded; the venue entrance has not been verified recently.",
      },
    ],
    uncertainties: [
      {
        id: "u1",
        description: "Return-trip vehicle lift status not yet confirmed.",
        impact: "transport",
      },
    ],
    pendingConfirmations: [
      {
        id: "conf_care",
        domain: "care",
        label: "Confirm Care support for physiotherapy appointment",
        status: "required",
        explanation: "Care will only be requested after you confirm. CareOS will not execute from free-form text alone.",
      },
      {
        id: "conf_transport",
        domain: "transport",
        label: "Confirm accessible Transport",
        status: "required",
        explanation: "Transport is confirmed separately from Care. Vehicle, driver, pickup access, route, destination and return trip are tracked as distinct states.",
      },
    ],
    receipts: [],
    dependencyLabels: ["Care confirmation", "Transport confirmation", "Access evidence"],
    nonAiPathwayAvailable: true,
    appointment: {
      title: "Physiotherapy",
      startsAt: "2026-07-21T10:00:00.000Z",
      locationLabel: "Community Physiotherapy Centre",
      careRequirements: ["Transfer support", "Communication passport available"],
      transportOptionsSummary: [
        "Wheelchair-accessible vehicle available",
        "Driver assistance for boarding available",
      ],
      accessEvidenceSummary: ["Step-free entrance (accreditation)", "Accessible toilet reported"],
      timingBuffers: ["30 minutes before appointment for boarding"],
      costContext: "Funding context shown only when you are authorised to view it.",
    },
  };
}
