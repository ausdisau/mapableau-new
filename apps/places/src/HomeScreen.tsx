import React from "react";
import { Text, View } from "react-native";

import { useCatalog } from "./catalog";
import { usePlacesStore } from "./store";
import { Action, Card, COLORS, Heading, Notice, S, Screen } from "./ui";

type HomeDestination = "Support" | "Places" | "Saved" | "More";

export function HomeScreen({ onOpen }: { onOpen: (destination: HomeDestination) => void }) {
  const { state, ready } = usePlacesStore();
  const { connection } = useCatalog();
  return <Screen>
    <View style={S.hero}>
      <Text style={[S.eyebrow, { color: "#D9FBFF" }]}>Australian Disability Ltd · MapAble</Text>
      <Text accessibilityRole="header" style={S.heroTitle}>Access the ordinary, every day.</Text>
      <Text style={S.heroSubtitle}>
        Discover services, explore accessible places and prepare local drafts—
        with control over your information and without another hosting account.
      </Text>
    </View>
    <Notice kind="warn">
      Static-first companion, not the complete MapAble platform. The app does not
      book supports, submit reports, check worker screening or establish NDIS eligibility.
      Sensitive services remain separate until approved backends are available.
    </Notice>
    <Card>
      <Heading level={2}>Care and support</Heading>
      <Text style={S.body}>Search the bundled national provider-directory snapshot by location and support category.</Text>
      <Action label="Find care and support organisations" primary onPress={() => onOpen("Support")}/>
    </Card>
    <Card>
      <Heading level={2}>Places and accessibility</Heading>
      <Text style={S.body}>Explore practical accessibility evidence with a list-first interface. No GPS or check-ins.</Text>
      <Action label="Explore accessible places" onPress={() => onOpen("Places")}/>
    </Card>
    <Card>
      <Heading level={2}>My private records</Heading>
      <Text style={S.body}>
        {ready ? state.savedPlaces.length : "…"} places saved on this device.
        Private drafts are not sent to providers or other users.
      </Text>
      <Action label="Open my locally saved places" onPress={() => onOpen("Saved")}/>
    </Card>
    <Card>
      <Heading level={2}>Community, Transport and Jobs</Heading>
      <Text style={S.body}>
        Community drafts and early planning guidance are available offline.
        Live community posts, transport bookings, job applications and payments are not connected.
      </Text>
      <Action label="Explore additional MapAble modules" onPress={() => onOpen("More")}/>
    </Card>
    <Text style={S.small}>
      Current place-directory connection: {connection.replace(/-/g, " ")}. Information is advisory.
      No advertising SDK, login requirement or location tracking is added by this build.
    </Text>
  </Screen>;
}
