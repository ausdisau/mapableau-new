import React, { useState } from "react";
import { FlatList, Linking, Text, View } from "react-native";
import { useCatalog } from "./catalog";
import type { EvidenceStatus, Place } from "./domain";
import { usePlacesStore } from "./store";
import { Action, Card, Choice, COLORS, Field, Heading, Notice, S } from "./ui";

type Filter = "all" | "step-free" | "toilet" | "needs-confirmation";

function EvidenceLine({ label, status, detail }: {
  label: string; status: EvidenceStatus; detail: string;
}) {
  const words = status === "documented" ? "Documented by source, not independently assessed"
    : status === "conditional" ? "Conditional; confirm access" : "Unknown";
  return <View style={{ gap: 4 }}>
    <Text style={S.label}>{label}: {words}</Text>
    <Text style={S.body}>{detail}</Text>
  </View>;
}

function PlaceCard({ place, saved, expanded, toggle, expand }: {
  place: Place; saved: boolean; expanded: boolean;
  toggle: () => void; expand: () => void;
}) {
  return <Card>
    <Text style={S.eyebrow}>{place.suburb} · {place.category}</Text>
    <Heading level={2}>{place.name}</Heading>
    <Text style={S.body}>{place.description}</Text>
    <Text style={S.small}>
      Step-free: {place.stepFree.status}. Accessible toilet: {place.accessibleToilet.status}.
    </Text>
    {place.source === "mapable-directory" && <Notice kind="warn">
      This is a live MapAble directory listing, not a feature-level accessibility assessment.
    </Notice>}
    <View style={S.row}>
      <Action label={saved ? "Remove from My Places" : "Save to My Places"} selected={saved} onPress={toggle}
        hint="Saves the place's name and suburb on your device, without a location check-in." />
      <Action label={expanded ? "Hide access details" : "Read access details"} selected={expanded} onPress={expand}/>
    </View>
    {expanded && <View style={{ gap: 13, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 }}>
      <EvidenceLine label="Step-free entry" status={place.stepFree.status} detail={place.stepFree.detail}/>
      <EvidenceLine label="Accessible toilets" status={place.accessibleToilet.status} detail={place.accessibleToilet.detail}/>
      <Notice kind="warn">{place.caution}</Notice>
      <Text style={S.small}>
        Evidence source: {place.sourceLabel}.
        {place.sourceReviewedAt ? " Last retrieved or checked " + place.sourceReviewedAt + "." : ""}
        {" "}This listing is not a guarantee of suitability.
      </Text>
      {place.sourceUrl && <Action
        label="Open source website (external)"
        hint="Opens the published source in your browser. That website receives a normal browser request; no current GPS location is sent."
        onPress={() => { void Linking.openURL(place.sourceUrl!); }}/>}
    </View>}
  </Card>;
}

export function ExploreScreen() {
  const { places, message, connection, refresh } = useCatalog();
  const { state, dispatch } = usePlacesStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const text = query.trim().toLowerCase();
  const results = places.filter((p) => {
    const matches = (p.name + " " + p.suburb + " " + p.category).toLowerCase().includes(text);
    if (!matches) return false;
    if (filter === "step-free") return p.stepFree.status === "documented";
    if (filter === "toilet") return p.accessibleToilet.status === "documented";
    if (filter === "needs-confirmation") return p.stepFree.status !== "documented" || p.accessibleToilet.status !== "documented";
    return true;
  });
  const header = <View style={{ gap: 17, paddingBottom: 15 }}>
    <View style={S.hero}>
      <Text style={[S.eyebrow,{color:"#D9FBFF"}]}>MapAble Places · Prototype</Text>
      <Text accessibilityRole="header" style={S.heroTitle}>Find places. Build belonging.</Text>
      <Text style={S.heroSubtitle}>
        Discover local places using practical accessibility evidence. Browsing does not require GPS or a check-in.
      </Text>
    </View>
    <Notice>These are example Sydney locations and optional published MapAble records. No venue is claimed as a CripSquare partner.</Notice>
    <Field label="Find a place, suburb or category" value={query} onChangeText={setQuery}
      placeholder="Try library, museum or The Rocks" returnKeyType="search"
      help="Search locally. Your text is not forwarded to an advertising or tracking service."/>
    <Choice<Filter> label="Filter the published information" options={[
      { value:"all", label:"Show all" },
      { value:"step-free", label:"Step-free documented" },
      { value:"toilet", label:"Toilet documented" },
      { value:"needs-confirmation", label:"Needs checking" },
    ]} value={filter} onChange={setFilter}/>
    <Text style={S.small}>
      Documented means a source describes a feature. It does not mean MapAble has independently inspected it.
    </Text>
    <Notice live>{message}</Notice>
    {connection !== "offline-demo" && <Action label="Refresh published MapAble places"
      onPress={() => { void refresh(); }} disabled={connection === "loading"}/>}
    <Text accessibilityLiveRegion="polite" style={S.label}>{results.length} places in these results</Text>
  </View>;

  return <FlatList
    style={S.background}
    contentContainerStyle={S.container}
    keyboardShouldPersistTaps="handled"
    data={results}
    keyExtractor={item=>item.id}
    ListHeaderComponent={header}
    ListEmptyComponent={<Notice kind="warn">No matches. Clear the search or select Show all to browse every place.</Notice>}
    renderItem={({ item }) => <View style={{ marginBottom: 14 }}>
      <PlaceCard place={item}
        saved={state.savedPlaces.some(p=>p.id===item.id)}
        expanded={expandedId === item.id}
        expand={()=>setExpandedId(v=>v===item.id?null:item.id)}
        toggle={()=>dispatch({ type:"toggle-saved", place:item, at:new Date().toISOString() })}/>
    </View>}
  />;
}
