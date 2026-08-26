import React, { createContext, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { createStaticNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  isMapAbleApiConfigured,
  searchMapAblePlaces,
  type MapAblePlaceSearchResult,
} from "./src/runtime/mapableApi";
import {
  isMapAblePlatformConfigured,
  loadMapAbleMobileBootstrap,
  mapAbleWebUrl,
  type MapAbleMobileBootstrap,
} from "./src/runtime/platformApi";

const colours = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF2F6",
  border: "#D7DEE7",
  text: "#0B1220",
  muted: "#4B5565",
  navy: "#0C1833",
  navySoft: "#E9EDF5",
  yellow: "#F8C51C",
  teal: "#0B6B67",
  danger: "#8B1E1E",
};

type PlatformState = {
  bootstrap: MapAbleMobileBootstrap | null;
  loading: boolean;
  error: string | null;
};

const PlatformContext = createContext<PlatformState>({
  bootstrap: null,
  loading: false,
  error: null,
});

function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>({
    bootstrap: null,
    loading: isMapAblePlatformConfigured(),
    error: null,
  });

  useEffect(() => {
    if (!isMapAblePlatformConfigured()) return;
    let active = true;

    void loadMapAbleMobileBootstrap()
      .then((bootstrap) => {
        if (active) setState({ bootstrap, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          bootstrap: null,
          loading: false,
          error: error instanceof Error ? error.message : "MapAble platform status is unavailable.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return <PlatformContext.Provider value={state}>{children}</PlatformContext.Provider>;
}

function usePlatform() {
  return useContext(PlatformContext);
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function BrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.headerStack}>
      <View style={styles.brandRow} accessible accessibilityLabel="MapAble — Empowering Independence">
        <Text style={styles.wordmark}>MapAble</Text>
        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>EMPOWERING INDEPENDENCE</Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Button({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function ActionTile({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.buttonPressed]}
    >
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.muted}>{detail}</Text>
    </Pressable>
  );
}

function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warning" }) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "good" && styles.statusPillGood,
        tone === "warning" && styles.statusPillWarning,
      ]}
    >
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

function PlatformStatusCard() {
  const { bootstrap, loading, error } = usePlatform();
  const configured = isMapAblePlatformConfigured();

  return (
    <Card>
      <View style={styles.cardHeadingRow}>
        <Text style={styles.cardTitle}>Platform connection</Text>
        {!configured ? (
          <StatusPill label="Not configured" tone="warning" />
        ) : loading ? (
          <StatusPill label="Checking" />
        ) : bootstrap ? (
          <StatusPill label="Connected" tone="good" />
        ) : (
          <StatusPill label="Unavailable" tone="warning" />
        )}
      </View>

      {!configured ? (
        <Text style={styles.muted}>
          Set EXPO_PUBLIC_MAPABLE_API_URL for this build. The app will not guess a private or preview API host.
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          <ActivityIndicator accessibilityLabel="Checking MapAble platform" />
          <Text style={styles.muted}>Checking MapAble capabilities…</Text>
        </View>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

      {bootstrap ? (
        <>
          <Text style={styles.body}>Access search is available without sharing live device location.</Text>
          <Text style={styles.muted}>
            Care, Transport and Jobs remain behind MapAble's authenticated server session boundary.
          </Text>
          <View style={styles.pillRow}>
            <StatusPill label={bootstrap.realtime.enabled ? "Realtime configured" : "Realtime off"} />
            <StatusPill label={bootstrap.realtime.redisBackplaneConfigured ? "Redis configured" : "Redis off"} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

function TodayScreen() {
  return (
    <Screen>
      <BrandHeader
        title="Today"
        subtitle="Access, support, travel and work in one participant-controlled app."
      />

      <View style={styles.grid}>
        <ActionTile
          title="Find access"
          detail="Search verified and community accessibility information"
          onPress={() => void Linking.openURL(mapAbleWebUrl("/"))}
        />
        <ActionTile
          title="My care"
          detail="Support requests, bookings and shifts"
          onPress={() => void Linking.openURL(mapAbleWebUrl("/care"))}
        />
        <ActionTile
          title="My travel"
          detail="Accessible transport and journey coordination"
          onPress={() => void Linking.openURL(mapAbleWebUrl("/transport"))}
        />
        <ActionTile
          title="My work"
          detail="Inclusive jobs and support planning"
          onPress={() => void Linking.openURL(mapAbleWebUrl("/jobs"))}
        />
      </View>

      <SectionTitle>Connected journeys</SectionTitle>
      <Card>
        <Text style={styles.eyebrow}>CARE + TRANSPORT</Text>
        <Text style={styles.cardTitle}>Get to a support appointment</Text>
        <Text style={styles.body}>
          MapAble is designed to coordinate the support and the accessible trip while keeping each confirmation separate and visible.
        </Text>
      </Card>
      <Card>
        <Text style={styles.eyebrow}>JOBS + TRANSPORT + CARE</Text>
        <Text style={styles.cardTitle}>Plan a workday</Text>
        <Text style={styles.body}>
          A job, workplace adjustments, transport and optional support can share one timeline without automatically disclosing disability information to an employer.
        </Text>
      </Card>

      <SectionTitle>Your control</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Nothing is booked just because it is suggested</Text>
        <Text style={styles.body}>You review providers, transport, timing, information sharing and prices before confirmation.</Text>
        <Text style={styles.muted}>Location is not requested by the current native Access search.</Text>
      </Card>

      <SectionTitle>System status</SectionTitle>
      <PlatformStatusCard />
    </Screen>
  );
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not specified";
  return value.replace(/_/g, " ");
}

function MapAbleSearchResult({ result }: { result: MapAblePlaceSearchResult }) {
  const { place, matchReasons } = result;
  return (
    <View
      style={styles.searchResult}
      accessible
      accessibilityLabel={`${place.name}, ${place.suburb ?? "suburb not specified"}`}
    >
      <Text style={styles.cardTitle}>{place.name}</Text>
      <Text style={styles.body}>{place.suburb ?? "Suburb not specified"} · {formatLabel(place.category)}</Text>
      <Text style={styles.muted}>Confidence: {formatLabel(place.confidence)} · Reviews: {place.reviewCount}</Text>
      {place.accreditationTier ? <Text style={styles.muted}>Accreditation: {formatLabel(place.accreditationTier)}</Text> : null}
      {matchReasons.length > 0 ? <Text style={styles.muted}>Why it matched: {matchReasons.join(" · ")}</Text> : null}
    </View>
  );
}

function AccessScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapAblePlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const configured = isMapAbleApiConfigured();

  async function runSearch() {
    setMessage(null);
    setResults([]);

    if (!configured) {
      setMessage("MapAble platform connection is not configured for this build.");
      return;
    }
    if (!query.trim()) {
      setMessage("Enter a place, suburb or category to search.");
      return;
    }

    setLoading(true);
    try {
      const nextResults = await searchMapAblePlaces(query);
      setResults(nextResults);
      if (nextResults.length === 0) setMessage("No matching places were returned. Try a broader search.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "MapAble search could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <BrandHeader
        title="Access"
        subtitle="Find places using feature-level accessibility information and visible confidence."
      />

      <Card>
        <Text style={styles.cardTitle}>Search MapAble</Text>
        <Text style={styles.body}>Search by place, suburb or category.</Text>
        <Text style={styles.muted}>Only the text you type is sent. Live device location is not requested by this flow.</Text>

        <TextInput
          accessibilityLabel="Search MapAble places"
          value={query}
          onChangeText={setQuery}
          placeholder="Place, suburb or category"
          placeholderTextColor={colours.muted}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch()}
          style={styles.input}
        />
        <Button label={loading ? "Searching" : "Search"} primary onPress={() => void runSearch()} disabled={loading} />

        {loading ? (
          <View style={styles.statusRow} accessibilityLiveRegion="polite">
            <ActivityIndicator accessibilityLabel="Searching MapAble" />
            <Text style={styles.muted}>Searching MapAble…</Text>
          </View>
        ) : null}
        {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
        {results.map((result) => <MapAbleSearchResult key={result.place.id} result={result} />)}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Evidence, not a generic accessible/not-accessible label</Text>
        <Text style={styles.body}>
          Listings can show source confidence, review count and accreditation status. Accessibility can change, so check the details that matter to you before relying on a listing.
        </Text>
      </Card>
    </Screen>
  );
}

function ProtectedModuleScreen({
  title,
  subtitle,
  eyebrow,
  body,
  webPath,
  webLabel,
  liveContract,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  body: string;
  webPath: string;
  webLabel: string;
  liveContract: string;
}) {
  const { bootstrap } = usePlatform();
  const nativeExchange = bootstrap?.auth.nativeSessionExchange === true;

  return (
    <Screen>
      <BrandHeader title={title} subtitle={subtitle} />

      <Card>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.cardTitle}>Same MapAble service, native client</Text>
        <Text style={styles.body}>{body}</Text>
        <Button label={webLabel} primary onPress={() => void Linking.openURL(mapAbleWebUrl(webPath))} />
      </Card>

      <SectionTitle>Native connection</SectionTitle>
      <Card>
        <View style={styles.cardHeadingRow}>
          <Text style={styles.cardTitle}>Protected participant data</Text>
          <StatusPill label={nativeExchange ? "Server bridge flagged" : "Web session only"} tone="warning" />
        </View>
        <Text style={styles.body}>
          This build does not bypass MapAble's authenticated session boundary. Until the native session exchange is implemented and verified, live protected data opens through the secure web flow.
        </Text>
        <Text style={styles.muted}>{liveContract}</Text>
      </Card>

      <SectionTitle>Participant control</SectionTitle>
      <Card>
        <Text style={styles.body}>• No automatic provider assignment.</Text>
        <Text style={styles.body}>• No silent location or health-data sharing.</Text>
        <Text style={styles.body}>• Confirmations stay separate for distinct services.</Text>
        <Text style={styles.body}>• Complaints, incidents and human support remain available outside automation.</Text>
      </Card>
    </Screen>
  );
}

function CareScreen() {
  return (
    <ProtectedModuleScreen
      title="Care"
      subtitle="Participant-controlled support discovery, requests, bookings and shifts."
      eyebrow="MAPABLE CARE"
      body="The native Care surface is being built over the same MapAble booking, request, schedule and shift services used by the web platform."
      webPath="/care"
      webLabel="Open Care securely on web"
      liveContract="Existing server contracts include Care bookings, requests, schedules, shifts, service logs and incidents."
    />
  );
}

function TransportScreen() {
  return (
    <ProtectedModuleScreen
      title="Travel"
      subtitle="Accessible journey coordination around your mobility and assistance needs."
      eyebrow="MAPABLE TRANSPORT"
      body="The native Transport surface is designed to reuse MapAble quotes, bookings, trips, routing and accessibility services rather than create a separate transport system."
      webPath="/transport"
      webLabel="Open Transport securely on web"
      liveContract="Existing server contracts include Transport quotes, bookings, trips, routing, accessibility, continuity and disruption data."
    />
  );
}

function JobsScreen() {
  return (
    <ProtectedModuleScreen
      title="Jobs"
      subtitle="Inclusive work discovery with candidate-controlled disclosure and support planning."
      eyebrow="MAPABLE JOBS"
      body="The native Jobs surface will use the existing MapAble Jobs service and then connect optional transport, care and adjustment planning around the participant's choices."
      webPath="/jobs"
      webLabel="Open Jobs securely on web"
      liveContract="The server already exposes authenticated Jobs discovery and job-detail contracts; native application and disclosure flows remain gated."
    />
  );
}

const Tabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
    tabBarStyle: { minHeight: 66, paddingBottom: 8, paddingTop: 6 },
    tabBarActiveTintColor: colours.navy,
    tabBarInactiveTintColor: colours.muted,
    tabBarHideOnKeyboard: true,
  },
  screens: {
    Today: TodayScreen,
    Access: AccessScreen,
    Care: CareScreen,
    Travel: TransportScreen,
    Jobs: JobsScreen,
  },
});

const Navigation = createStaticNavigation(Tabs);

export default function App() {
  return (
    <PlatformProvider>
      <StatusBar style="dark" />
      <Navigation />
    </PlatformProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.background },
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  headerStack: { gap: 8, paddingTop: 4 },
  brandRow: { alignSelf: "flex-start", gap: 6 },
  wordmark: { fontSize: 24, lineHeight: 30, fontWeight: "900", color: colours.navy, letterSpacing: -0.5 },
  taglinePill: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: colours.navy, paddingHorizontal: 10, paddingVertical: 5 },
  taglineText: { fontSize: 10, lineHeight: 12, fontWeight: "900", letterSpacing: 0.8, color: colours.yellow },
  title: { fontSize: 30, lineHeight: 38, fontWeight: "900", color: colours.text, marginTop: 4 },
  subtitle: { fontSize: 17, lineHeight: 25, color: colours.muted },
  sectionTitle: { marginTop: 6, fontSize: 20, lineHeight: 27, fontWeight: "900", color: colours.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { minHeight: 124, minWidth: 148, flexGrow: 1, flexBasis: "46%", justifyContent: "center", gap: 8, padding: 16, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.border, borderRadius: 16 },
  tileTitle: { fontSize: 18, lineHeight: 24, fontWeight: "900", color: colours.navy },
  card: { gap: 12, padding: 16, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.border, borderRadius: 16 },
  cardHeadingRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: "900", color: colours.text },
  body: { fontSize: 16, lineHeight: 24, color: colours.text },
  muted: { fontSize: 14, lineHeight: 21, color: colours.muted },
  eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 1.1, fontWeight: "900", color: colours.teal },
  button: { minHeight: 52, minWidth: 104, paddingHorizontal: 16, paddingVertical: 10, justifyContent: "center", alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: colours.border, backgroundColor: colours.surface },
  buttonPrimary: { backgroundColor: colours.navy, borderColor: colours.navy },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.72 },
  buttonText: { fontSize: 16, lineHeight: 22, fontWeight: "900", color: colours.text, textAlign: "center" },
  buttonTextPrimary: { color: "#FFFFFF" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusPill: { minHeight: 32, justifyContent: "center", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colours.surfaceMuted },
  statusPillGood: { backgroundColor: "#DDF4EA" },
  statusPillWarning: { backgroundColor: "#FFF2C2" },
  statusPillText: { fontSize: 12, lineHeight: 16, fontWeight: "900", color: colours.navy },
  input: { minHeight: 54, borderWidth: 1, borderColor: colours.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colours.surface, color: colours.text, fontSize: 16 },
  statusRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  searchResult: { gap: 5, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colours.border },
  error: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: colours.danger },
});
