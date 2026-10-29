import React, { useState } from "react";
import { Linking, Text, View } from "react-native";

import { Action, Card, Heading, Notice, S, Screen } from "./ui";

/**
 * Mobile-safe handoff: Expo Places has no authenticated API token/session bridge.
 * Do not copy NextAuth cookies into React Native or embed a service credential
 * in EXPO_PUBLIC. Until an approved OAuth/PKCE client is integrated,
 * authenticated search lives on the official first-party MapAble website.
 */
const PROVIDER_FINDER = "https://mapable.com.au/provider-finder";
const FINDER_PREFERENCES = "https://mapable.com.au/provider-finder/preferences";

export function SupportSearchScreen() {
  const [error, setError] = useState("");

  async function openTrustedMapAble(url: string) {
    setError("");
    try {
      const destination = new URL(url);
      if (destination.protocol !== "https:" || destination.host !== "mapable.com.au") {
        throw new Error("Unrecognised MapAble destination");
      }
      await Linking.openURL(destination.toString());
    } catch {
      setError("Could not open MapAble. Check your internet connection or open mapable.com.au directly.");
    }
  }

  return <Screen>
    <View style={S.hero}>
      <Text style={[S.eyebrow, { color: "#D9FBFF" }]}>MapAble Care · Find support</Text>
      <Text accessibilityRole="header" style={S.heroTitle}>Find people and support services that work for you.</Text>
      <Text style={S.heroSubtitle}>
        Chat about the services you want, browse disability support providers, and review matching evidence.
      </Text>
    </View>
    <Notice>
      This mobile prototype opens the secure MapAble web finder. It does not sign in
      natively or send your personal preferences, health details, GPS, or worker credentials.
    </Notice>
    <Card>
      <Heading level={2}>Provider and worker discovery</Heading>
      <Text style={S.body}>
        Open the provider finder in your browser. Sign in there if you want
        opted-in worker profiles and to choose personalised search results.
      </Text>
      <Action label="Open MapAble provider finder" primary
        hint="Opens the official MapAble website. Authentication takes place in your browser."
        onPress={() => { void openTrustedMapAble(PROVIDER_FINDER); }} />
      <Text style={S.small}>
        Providers appear from directory data; worker profiles appear only if their owners
        have opted in. Neither appearance proves a current clearance, quality or availability.
      </Text>
    </Card>
    <Card>
      <Heading level={2}>Control your search preferences</Heading>
      <Text style={S.body}>
        Save broad service, region and communication language preferences only if you choose.
        You can stop personalisation and erase saved preferences.
      </Text>
      <Action label="Manage my preferences on MapAble"
        hint="Opens the first-party preference page. A web sign-in may be required."
        onPress={() => { void openTrustedMapAble(FINDER_PREFERENCES); }} />
    </Card>
    {error ? <Notice kind="error" live>{error}</Notice> : null}
    <Notice kind="warn">
      Screening checks for individual NDIS workers are not available by public worker-name
      search. Ask an authorised provider or participant to use the official NDIS Worker Screening pathway.
    </Notice>
  </Screen>;
}
