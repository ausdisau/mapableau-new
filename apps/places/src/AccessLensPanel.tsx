import React, { useMemo, useState } from "react";
import { Share, Text, TextInput, View } from "react-native";

import {
  ACCESS_CHECKS,
  DEFAULT_ACCESS_CHECKS,
  evaluatePlaceEvidence,
  makeCommunityReadiness,
  makeVenueQuestionsDraft,
  type AccessCheckKey,
  type AccessCheckSelection,
  type EvidenceFinding,
} from "./access-lens";
import type { Place } from "./domain";
import { Action, Card, Heading, Notice, S } from "./ui";

const keys: AccessCheckKey[] = [
  "stepFree", "accessibleToilet", "communication", "sensory", "transport",
];
const labels: Record<EvidenceFinding, string> = {
  "source-described": "Source describes feature — confirm suitability",
  "conditional": "Conditions or limitations reported",
  "not-assessed": "Not assessed in this record",
};

/**
 * An intentionally local-only evidence lens. Nothing is stored or transmitted
 * until the participant explicitly opens their operating system's share sheet.
 */
export function AccessLensPanel({
  place,
  gatheringName,
}: {
  place: Place;
  gatheringName?: string;
}) {
  const [selection, setSelection] = useState<AccessCheckSelection>(DEFAULT_ACCESS_CHECKS);
  const [feedback, setFeedback] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [showSources, setShowSources] = useState(false);

  const results = useMemo(
    () => evaluatePlaceEvidence(place, selection),
    [place, selection],
  );
  const draft = useMemo(
    () => makeVenueQuestionsDraft(place, results, { gatheringName }),
    [gatheringName, place, results],
  );
  const readiness = useMemo(
    () => gatheringName ? makeCommunityReadiness(gatheringName, place, results) : [],
    [gatheringName, place, results],
  );

  function toggle(key: AccessCheckKey) {
    setSelection((old) => ({ ...old, [key]: !old[key] }));
    setShowDraft(false);
    setDraftText("");
    setFeedback("");
  }

  async function shareDraft() {
    if (!draftText.trim()) {
      setFeedback("The draft is empty. Restore the suggested questions or enter your own before sharing.");
      return;
    }
    try {
      await Share.share({
        title: "Pre-visit accessibility questions (draft)",
        message: draftText,
      });
      setFeedback("The device sharing options were opened. Review your destination before sending. No MapAble or CripSquare post was created.");
    } catch {
      setFeedback("The share panel is unavailable. Select and copy the draft text below instead.");
    }
  }

  return (
    <View style={{ gap: 15, borderTopWidth: 1, borderTopColor: "#B8C6CB", paddingTop: 16 }}>
      <Heading level={3}>AccessFit Evidence Lens</Heading>
      <Text style={S.body}>
        Choose which practical features to investigate. Your selections stay
        on this screen; they are not saved, profiled or sent to a server.
      </Text>
      <Notice kind="warn">
        This is not an accessibility rating or confirmation that a place will
        work for you. Published information can be incomplete or out of date.
      </Notice>

      <View style={{ gap: 8 }}>
        <Text style={S.label}>What would you like to check?</Text>
        {keys.map((key) => (
          <Action
            key={key}
            label={(selection[key] ? "Included: " : "Add: ") + ACCESS_CHECKS[key].label}
            selected={selection[key]}
            onPress={() => toggle(key)}
            hint="Toggles an access question locally. No disability or medical information is requested."
          />
        ))}
      </View>
      <Text accessibilityLiveRegion="polite" style={S.small}>
        {results.length} access {results.length === 1 ? "topic" : "topics"} selected.
      </Text>

      {results.length === 0 ? (
        <Notice>Choose at least one feature to see evidence and prepare a question.</Notice>
      ) : (
        <View style={{ gap: 12 }}>
          <Heading level={3}>What the source tells us</Heading>
          {results.map((item) => (
            <Card key={item.key}>
              <Text style={S.label}>{item.label}</Text>
              <Text style={S.small}>{labels[item.finding]}</Text>
              <Text style={S.body}>{item.evidence}</Text>
              <Text style={S.small}>Evidence: {item.provenance}</Text>
              <Text style={S.body}>Question to ask: {item.question}</Text>
            </Card>
          ))}
        </View>
      )}

      <Action
        label={showSources ? "Hide source details" : "Review source details"}
        selected={showSources}
        onPress={() => setShowSources((current) => !current)}
      />
      {showSources && (
        <View style={{ gap: 8 }}>
          <Text style={S.body}>Place: {place.name}</Text>
          <Text style={S.body}>Source type: {place.source === "illustrative" ? "Demonstration record" : "Published MapAble directory"}</Text>
          <Text style={S.body}>Attribution: {place.sourceLabel}</Text>
          <Text style={S.body}>Retrieved or checked: {place.sourceReviewedAt ?? "Date not available"}</Text>
          <Text style={S.body}>Known cautions: {place.caution}</Text>
          {place.sourceUrl && <Text style={S.small}>Published source URL: {place.sourceUrl}</Text>}
        </View>
      )}

      {gatheringName && (
        <View style={{ gap: 8 }}>
          <Heading level={3}>Community gathering readiness</Heading>
          <Text style={S.small}>
            No CripSquare event, RSVP or invitation is being created.
          </Text>
          {readiness.map((line, index) => (
            <Text key={index} style={S.body}>{index + 1}. {line}</Text>
          ))}
        </View>
      )}

      <Action
        label={showDraft ? "Hide questions draft" : "Prepare a venue enquiry"}
        disabled={results.length === 0}
        primary
        onPress={() => {
          if (!showDraft) setDraftText(draft);
          setShowDraft((old) => !old);
          setFeedback("");
        }}
        hint="Opens a local plain-text draft; nothing is sent to the venue."
      />
      {showDraft && results.length > 0 && (
        <View style={{ gap: 12 }}>
          <Heading level={3}>Review before sharing</Heading>
          <Text style={S.body}>
            The draft asks about practical features without including your
            diagnosis, current location, attendance history or identity. Sharing
            it may still reveal which access topics interest you.
          </Text>
          <TextInput
            accessibilityLabel="Review and edit the venue enquiry draft"
            accessibilityHint="You can edit, select and copy this draft. Nothing is automatically shared."
            multiline
            maxLength={5000}
            value={draftText}
            onChangeText={setDraftText}
            style={[S.input, S.textArea, { minHeight: 240 }]}
          />
          <Action
            label="Restore suggested questions"
            onPress={() => { setDraftText(draft); setFeedback(""); }}
            hint="Replaces your edits with the original suggested questions. Nothing is sent."
          />
          <Action
            label="Open my device sharing options"
            onPress={() => { void shareDraft(); }}
            hint="You must choose the destination. The app does not send this message automatically."
          />
          {feedback ? <Notice live>{feedback}</Notice> : null}
        </View>
      )}
    </View>
  );
}
