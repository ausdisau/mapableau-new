import React, { useMemo, useState } from "react";
import { FlatList, Linking, Text, View } from "react-native";

import generated from "./generated/provider-directory.json";
import {
  interpretProviderQuestion,
  matchingProviders,
  publicOpenStreetMapSearch,
  SERVICE_OPTIONS,
  type OfflineProvider,
  type ProviderDirectory,
  type SearchFilters,
  type ServiceFilter,
} from "./providers";
import { Action, Card, Choice, COLORS, Field, Heading, Notice, S } from "./ui";

const directory = generated as ProviderDirectory;
const STATE_OPTIONS = [
  { value: "ALL", label: "All Australia" },
  ...["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].map(value => ({ value, label: value })),
];

function ResultCard({ item }: { item: OfflineProvider }) {
  const [showDetails, setShowDetails] = useState(false);
  return <Card>
    <Text style={S.eyebrow}>{[item.suburb, item.state, item.postcode].filter(Boolean).join(" · ")}</Text>
    <Heading level={2}>{item.name}</Heading>
    <Text style={S.small}>Imported organisation entry · current registration not independently verified</Text>
    <Text style={S.body}>{item.categories.length ? item.categories.slice(0, 3).join("; ") : "No registration-group details in this import."}</Text>
    <View style={S.row}>
      <Action label={showDetails ? "Hide listing details" : "Review listing details"} selected={showDetails}
        onPress={() => setShowDetails(value => !value)} />
      <Action label="Find this locality on OpenStreetMap"
        hint="Opens a suburb-level search in your browser, not an exact provider address."
        onPress={() => { void Linking.openURL(publicOpenStreetMapSearch(item)); }} />
    </View>
    {showDetails && <View style={{ gap: 8 }}>
      <Text style={S.label}>Registration groups in imported snapshot</Text>
      <Text style={S.body}>{item.categories.length ? item.categories.join("; ") : "Not listed"}</Text>
      <Notice kind="warn">
        This is not a screening clearance, a current registration confirmation, an accessibility inspection,
        or proof that services are available or suitable for your funding.
        Check current status directly with the NDIS Commission and provider.
      </Notice>
    </View>}
  </Card>;
}

export function ProvidersScreen() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState("ALL");
  const [service, setService] = useState<ServiceFilter>("all");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState<SearchFilters>({ state: "ALL", service: "all", query: "" });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("Browse a local snapshot. Searches never leave your device.");
  const matches = useMemo(() => matchingProviders(directory.providers, applied), [applied]);
  const visible = useMemo(() => matches.slice(0, Math.min(page * 35, 245)), [matches, page]);

  function applyFilters() {
    setApplied({ state, service, query: query.trim() });
    setPage(1);
    setMessage("Directory filters applied locally. No personal information was transmitted.");
  }

  function useQuestion() {
    if (!question.trim()) { setMessage("Enter a support request first."); return; }
    if (/\b(?:near me|current location|my location)\b/i.test(question)) {
      setMessage("MapAble has no GPS access. Please enter a suburb or postcode explicitly.");
      return;
    }
    const intent = interpretProviderQuestion(question);
    const nextState = intent.state ?? "ALL";
    const nextQuery = intent.postcode ?? intent.nameTerms;
    setState(nextState);
    setService(intent.service);
    setQuery(nextQuery);
    setApplied({ state: nextState, service: intent.service, query: nextQuery });
    setPage(1);
    setMessage("Interpreted your words as directory filters. Review the applied filters; this is not an AI or worker matching assessment.");
  }

  const header = <View style={{ gap: 15, paddingBottom: 15 }}>
    <View style={S.hero}>
      <Text style={[S.eyebrow, { color: "#D9FBFF" }]}>MapAble Care · Offline discovery</Text>
      <Text style={S.heroTitle} accessibilityRole="header">Find disability care and support.</Text>
      <Text style={S.heroSubtitle}>
        Search organisation records without a login, subscription, GPS or an application server.
      </Text>
    </View>
    <Notice kind="warn">
      This is an imported directory snapshot, not a live NDIS register. Entries are organisations,
      not verified individual workers. Registration, clearance, availability, accessibility and access fit need checking.
    </Notice>
    <Card>
      <Heading level={2}>Describe what you need</Heading>
      <Field label="Ask MapAble's local directory" value={question} onChangeText={setQuestion}
        placeholder="Find support coordination in NSW 2075" returnKeyType="search"
        help="Plain-language search is interpreted on your device, without AI network calls." />
      <Action label="Find results for my request" primary onPress={useQuestion}/>
      <Text style={S.small}>Use a postcode or state. Distance-based searches and individual worker matching are not available offline.</Text>
    </Card>
    <Card>
      <Heading level={2}>Refine your results</Heading>
      <Field label="Organisation name, suburb, postcode or category" value={query} onChangeText={setQuery}
        placeholder="e.g. 2075 or nursing" returnKeyType="search" />
      <Choice label="State or territory" options={STATE_OPTIONS} value={state} onChange={setState}/>
      <Choice label="Support category (imported registration labels)" options={SERVICE_OPTIONS}
        value={service} onChange={setService}/>
      <Action label="Apply directory filters" primary onPress={applyFilters}/>
    </Card>
    <Notice live>{message}</Notice>
    <Text style={S.small}>
      The bundled directory was packaged {directory.generatedAt.slice(0, 10)} from an existing repository snapshot.
      Packaging date is not the source verification date. No confidential addresses, phone numbers, emails or worker identities are distributed.
    </Text>
    <Text style={S.small}>Source: {directory.source}. Displaying {directory.providerCount.toLocaleString("en-AU")} locally indexed entries.</Text>
    <Text accessibilityLiveRegion="polite" style={S.label}>
      {matches.length.toLocaleString("en-AU")} entries match; showing {visible.length.toLocaleString("en-AU")}.
    </Text>
    <Action label="Open the official NDIS Commission Provider Register"
      onPress={() => { void Linking.openURL("https://www.ndiscommission.gov.au/provider-registration/find-registered-provider"); }}/>
  </View>;

  return <FlatList
    style={S.background} contentContainerStyle={S.container} keyboardShouldPersistTaps="handled"
    data={visible} keyExtractor={provider => provider.id}
    ListHeaderComponent={header}
    ListEmptyComponent={<Notice kind="warn">No matching organisation entries. Try a broader location or support category.</Notice>}
    renderItem={({ item }) => <View style={{ marginBottom: 14 }}><ResultCard item={item}/></View>}
    ListFooterComponent={visible.length < matches.length && visible.length < 245
      ? <Action label="Show 35 more directory entries" onPress={() => setPage(n => n + 1)}/>
      : matches.length > visible.length
        ? <Notice>Too many entries. Refine the search to narrow the results.</Notice> : null}
  />;
}
