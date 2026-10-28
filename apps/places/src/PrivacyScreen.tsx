import React, { useState } from "react";
import { AccessibilityInfo, Share, Text, TextInput, View } from "react-native";
import { useCatalog } from "./catalog";
import { usePlacesStore } from "./store";
import { Action, Card, Field, Heading, Notice, S, Screen } from "./ui";

export function PrivacyScreen() {
  const { state, ready, storageMessage, resetAll } = usePlacesStore();
  const { connection, message } = useCatalog();
  const [showExport, setShowExport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState("");
  const exported = JSON.stringify(state, null, 2);

  async function shareExport() {
    try {
      await Share.share({ message: exported, title: "My MapAble Places prototype data" });
      setFeedback("The operating-system share panel was opened. Your selected recipient determines where the data goes.");
    } catch {
      setFeedback("The share panel could not be opened. You can still select and copy the displayed JSON.");
    }
  }

  async function deleteRecords() {
    await resetAll();
    setConfirmReset(false);
    setShowExport(false);
    setFeedback("The local prototype records have been cleared; check storage status below.");
    AccessibilityInfo.announceForAccessibility?.("Local records cleared");
  }

  return <Screen>
    <Heading>Privacy & accessibility</Heading>
    <Text style={S.body}>Control your data, learn how to use the writing tools, and understand which connections are real.</Text>
    <Notice kind="warn">
      No location permissions, check-ins, advertising identifiers, user accounts or background tracking are used.
      This demo stores text on this device in unencrypted AsyncStorage; do not enter sensitive health information.
    </Notice>
    <Card>
      <Heading level={2}>Storage and integrations</Heading>
      <Text style={S.body}>Local data status: {ready?storageMessage:"Loading saved information…"}</Text>
      <Text style={S.body}>MapAble place feed: {connection.replace(/-/g," ")}.</Text>
      <Text style={S.small}>{message}</Text>
      <Text style={S.body}>CripSquare: not connected. Community circles, interests and posts are local demonstrations only.</Text>
      <Text style={S.body}>No real attendance confirmation or accessibility publication takes place.</Text>
    </Card>
    <Card>
      <Heading level={2}>Export my data</Heading>
      <Text style={S.body}>
        Export contains saved place names, memories, access reports, community-interest selections and posts.
        It may reveal information about you. No export is sent anywhere without your explicit sharing action.
      </Text>
      <Action label={showExport?"Hide my export":"Preview my local data export"} onPress={()=>setShowExport(v=>!v)}/>
      {showExport && <View style={{gap:12}}>
        <Text style={S.label}>Select and copy the JSON below or use the operating-system share control</Text>
        <TextInput
          accessibilityLabel="Portable JSON export of my local MapAble Places records"
          multiline editable={false} selectTextOnFocus
          value={exported}
          style={[S.input,S.textArea,{minHeight:220,fontSize:14}]}
        />
        <Action label="Open share panel for my exported data" onPress={()=>{void shareExport();}}
          hint="Only press if you intend to send or save a copy outside this device."/>
      </View>}
    </Card>
    <Card>
      <Heading level={2}>Delete my prototype data</Heading>
      <Text style={S.body}>
        Clear saved places, private notes, reports, community-interest selections and draft posts.
        This cannot withdraw content from a future external system; no such synchronisation exists in this build.
      </Text>
      {!confirmReset
        ? <Action label="Review deletion of all my local records" danger onPress={()=>setConfirmReset(true)}/>
        : <>
          <Notice kind="warn">This will remove all your MapAble Places prototype records from this device. Export a copy first if needed.</Notice>
          <View style={S.row}>
            <Action label="Confirm delete all local records" danger onPress={()=>{void deleteRecords();}}/>
            <Action label="Cancel deletion" onPress={()=>setConfirmReset(false)}/>
          </View>
        </>}
    </Card>
    {feedback ? <Notice kind="success" live>{feedback}</Notice> : null}

    <Card>
      <Heading level={2}>Accessible authoring help</Heading>
      <Text style={S.body}>
        Accessibility reports: identify a particular entrance, toilet, communication feature or other issue.
        Describe whether it worked for you, what you observed, when and how you obtained the information.
        Explain uncertainty; never use a general accessibility label instead of practical details.
      </Text>
      <Text style={S.body}>
        Community discussions: write meaningful titles and plain-text descriptions. Do not rely on visual styling, emoji
        or images alone. Images and multimedia are intentionally omitted until alternative text and captions can be supported.
      </Text>
      <Text style={S.body}>
        Interaction: navigate through the labelled tabs and buttons using a keyboard or device assistive technology.
        Text scales with system settings. The whole prototype can be used without a map, microphone, camera or GPS.
      </Text>
      <Text style={S.small}>
        Design targets: WCAG 2.2 AA and ATAG 2.0 Parts A/B. Formal conformance has not been independently tested or certified.
      </Text>
    </Card>
  </Screen>;
}
