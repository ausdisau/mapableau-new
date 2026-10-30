import React, { useState } from "react";
import { Linking, Text, View } from "react-native";

import { CommunityScreen } from "./CommunityScreen";
import { ContributeScreen } from "./ContributeScreen";
import { PrivacyScreen } from "./PrivacyScreen";
import { Action, Card, Choice, Field, Heading, Notice, S, Screen } from "./ui";

type Section = "index" | "community" | "contribute" | "privacy" | "transport" | "jobs";

function TransportPlanningScreen() {
  const [destination, setDestination] = useState("");
  const [access, setAccess] = useState<"mobility" | "communication" | "general">("general");
  const [prepared, setPrepared] = useState(false);
  return <Screen>
    <Heading>Transport access planning</Heading>
    <Notice kind="warn">Offline planning only. No booking, live service availability, GPS, route times or driver verification.</Notice>
    <Field label="Destination or suburb (not transmitted)" value={destination} onChangeText={value => {
      setDestination(value); setPrepared(false);
    }} placeholder="Destination, e.g. St Ives"/>
    <Choice label="Primary access planning concern" value={access} onChange={value => { setAccess(value); setPrepared(false); }}
      options={[{value:"general",label:"General"},{value:"mobility",label:"Step-free / mobility"},{value:"communication",label:"Communication"}]}/>
    <Action primary label="Prepare my local transport checklist" onPress={() => setPrepared(true)}/>
    {prepared && <Card>
      <Heading level={2}>Checklist to confirm with the operator</Heading>
      <Text style={S.body}>Destination: {destination.trim() || "Not specified"}. No route has been reserved.</Text>
      <Text style={S.body}>1. Confirm service availability, pickup/drop-off location and payment rules.</Text>
      <Text style={S.body}>2. Confirm the exact vehicle, boarding route and assistance arrangements.</Text>
      {access === "mobility" && <Text style={S.body}>3. Check ramp or lift dimensions, restraint compatibility and step-free transfers.</Text>}
      {access === "communication" && <Text style={S.body}>3. Agree on AAC, text communication and a clear pickup identification procedure.</Text>}
      {access === "general" && <Text style={S.body}>3. Confirm accessibility requirements directly, rather than assuming the vehicle is suitable.</Text>}
      <Text style={S.body}>4. Agree on contingency support if a service is cancelled or inaccessible.</Text>
    </Card>}
  </Screen>;
}

function EmploymentScreen() {
  return <Screen>
    <Heading>Employment and opportunity</Heading>
    <Notice kind="warn">The current offline companion does not list verified vacancies, submit applications or contact employers.</Notice>
    <Card>
      <Heading level={2}>Prepare for accessible employment</Heading>
      <Text style={S.body}>
        Consider workplace adjustments, communication access, travel, flexible scheduling,
        accessible recruitment and the support needed to make informed choices.
      </Text>
      <Action label="Open JobAccess Australia (external)" onPress={() => {
        void Linking.openURL("https://www.jobaccess.gov.au/");
      }}/>
    </Card>
  </Screen>;
}

export function MoreScreen() {
  const [section, setSection] = useState<Section>("index");
  if (section !== "index") {
    return <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
        <Action label="Back to MapAble modules" onPress={() => setSection("index")}/>
      </View>
      {section === "community" ? <CommunityScreen/> : null}
      {section === "contribute" ? <ContributeScreen/> : null}
      {section === "privacy" ? <PrivacyScreen/> : null}
      {section === "transport" ? <TransportPlanningScreen/> : null}
      {section === "jobs" ? <EmploymentScreen/> : null}
    </View>;
  }
  return <Screen>
    <Heading>More MapAble modules</Heading>
    <Text style={S.body}>Offline tools and transparent boundaries. These sections do not perform live bookings, regulatory checks or payments.</Text>
    <Card>
      <Heading level={2}>CripSquare community drafts</Heading>
      <Text style={S.body}>Explore clearly illustrative communities; draft content stays on your device.</Text>
      <Action label="Open community prototype" onPress={() => setSection("community")}/>
    </Card>
    <Card>
      <Heading level={2}>Contribute access observations</Heading>
      <Text style={S.body}>Prepare and review access-observation drafts locally before any future moderated publication.</Text>
      <Action label="Open local access report editor" onPress={() => setSection("contribute")}/>
    </Card>
    <Card>
      <Heading level={2}>Transport</Heading>
      <Text style={S.body}>Make an accessible transport checklist without GPS or a booking service.</Text>
      <Action label="Prepare a transport access checklist" onPress={() => setSection("transport")}/>
    </Card>
    <Card>
      <Heading level={2}>Jobs</Heading>
      <Text style={S.body}>Read practical employment-access guidance and visit an official resource.</Text>
      <Action label="Explore employment guidance" onPress={() => setSection("jobs")}/>
    </Card>
    <Card>
      <Heading level={2}>Privacy, export and deletion</Heading>
      <Text style={S.body}>Review the data stored locally and control portable exports or deletion.</Text>
      <Action label="Manage privacy and saved data" onPress={() => setSection("privacy")}/>
    </Card>
    <Notice>For current provider registration and worker screening, use the official NDIS Commission's authorised pathways.</Notice>
  </Screen>;
}
