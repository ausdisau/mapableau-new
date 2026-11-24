import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  audit,
  clinics,
  comparison,
  exampleAnswer,
  parseWidth,
  phrases,
  topics,
  views,
  visibleClinics,
  type Scope,
} from "../../../../mobile-contracts/search/workspace";
import { useSearchWorkspace } from "../../../../mobile-contracts/search/use-search-workspace";

const origin = "https://mapable.com.au";
function Action({
  children,
  onPress,
  selected,
  disabled,
}: {
  children: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      style={[s.button, selected && s.chosen, disabled && s.disabled]}
    >
      <Text style={[s.buttonText, selected && s.white]}>{children}</Text>
    </Pressable>
  );
}

export function SearchScreen({ close }: { close: () => void }) {
  const { state, dispatch, selected, browse, directory, retry } =
    useSearchWorkspace(origin);
  const [consent, setConsent] = useState(false),
    [support, setSupport] = useState(false);
  const [width, setWidth] = useState(""),
    [message, setMessage] = useState("");
  const [alternativesNote, setAlternativesNote] = useState(false),
    [transit, setTransit] = useState(true);
  const [scopeOpen, setScopeOpen] = useState(false),
    [helpDraft, setHelpDraft] = useState("");
  const [easy, setEasy] = useState(false);
  const input = useRef<TextInput>(null);
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const wide = screenWidth / fontScale >= 860;
  const visible = visibleClinics(state);
  const lastNotice = useRef("");
  const selectionNotice = state.demo
    ? selected
      ? "Selected clinic " +
        selected.id +
        ". " +
        comparison(selected.door, state.minimum)
      : "No clinic selected."
    : "";
  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      !selectionNotice ||
      lastNotice.current === selectionNotice
    )
      return;
    const timer = setTimeout(() => {
      lastNotice.current = selectionNotice;
      AccessibilityInfo.announceForAccessibilityWithOptions(selectionNotice, {
        queue: true,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [selectionNotice]);
  function open(path: string) {
    void Linking.openURL(origin + path).catch(() =>
      setMessage(
        "The page could not open. Visit mapable.com.au" +
          path +
          " in a browser.",
      ),
    );
  }
  function reset() {
    dispatch({ type: "reset" });
    setWidth("");
    setHelpDraft("");
    setSupport(false);
    setMessage("");
    setConsent(false);
    setAlternativesNote(false);
    setTransit(true);
  }
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.container}
    >
      <Text accessibilityRole="header" style={s.heading}>
        MapAble Search
      </Text>
      <View style={s.controls}>
        <Action onPress={close}>Close search and clear draft</Action>
        <Action selected={easy} onPress={() => setEasy(!easy)}>
          Easy read
        </Action>
        <Action
          selected={support}
          onPress={() => {
            setSupport(!support);
            setHelpDraft("");
          }}
        >
          Talk to a person
        </Action>
      </View>
      {support && (
        <View style={s.box}>
          <Text>
            Use the MapAble text contact form. Your search stays on this device.
            You can draft a note here and copy it yourself.
          </Text>
          <TextInput
            accessibilityLabel="Optional support note"
            multiline
            value={helpDraft}
            maxLength={600}
            onChangeText={setHelpDraft}
            style={s.input}
          />
          <Action onPress={() => open("/contact?topic=accessibility")}>
            Open text contact form
          </Action>
        </View>
      )}
      <View style={[s.layout, wide && s.wide]}>
        <View style={[s.column, wide && s.left]}>
          <Text accessibilityRole="header" style={s.title}>
            {easy ? "Ask a question" : "Find what works for you."}
          </Text>
          <View style={s.controls}>
            {(["Conversation", "Web"] as const).map((v) => (
              <Action
                key={v}
                selected={state.presentation === v}
                onPress={() => dispatch({ type: "presentation", value: v })}
              >
                {v}
              </Action>
            ))}
          </View>
          <Text>Quick · Free. Deep search unavailable.</Text>
          <Action selected={scopeOpen} onPress={() => setScopeOpen(!scopeOpen)}>
            {"Search scope · " + state.scope}
          </Action>
          {scopeOpen && (
            <View style={s.controls}>
              {(Object.keys(topics) as Scope[]).map((value) => (
                <Action
                  key={value}
                  selected={state.scope === value}
                  onPress={() => {
                    dispatch({ type: "scope", value });
                    setScopeOpen(false);
                    setWidth("");
                    setMessage("");
                  }}
                >
                  {value}
                </Action>
              ))}
            </View>
          )}
          {state.demo && (
            <Text style={s.emphasis}>
              Synthetic demo. Providers, measurements and checks are fictional.
            </Text>
          )}
          {state.question && state.presentation === "Conversation" ? (
            <View style={s.box}>
              <Text style={s.emphasis}>You</Text>
              <Text>{state.question}</Text>
              <Text style={s.emphasis}>MapAble</Text>
              <Text>
                {state.demo
                  ? selected
                    ? exampleAnswer(
                        state.question,
                        selected,
                        state.minimum,
                        easy,
                      )
                    : "No clinics visible. Show alternatives to compare."
                  : "Explore the public pathways for " +
                    state.scope.toLowerCase() +
                    "."}
              </Text>
            </View>
          ) : null}
          <Text accessibilityRole="header" style={s.sub}>
            AAC quick phrases
          </Text>
          <View style={s.phrases}>
            {phrases.map((p) => (
              <View key={p} style={s.tile}>
                <Action
                  onPress={() => {
                    dispatch({ type: "phrase", value: p });
                    input.current?.focus();
                  }}
                >
                  {p}
                </Action>
              </View>
            ))}
          </View>
          <Text>Ask MapAble</Text>
          <TextInput
            ref={input}
            accessibilityLabel="Ask MapAble"
            placeholder="Type or use your keyboard’s dictation"
            placeholderTextColor="#405367"
            multiline
            maxLength={600}
            value={state.draft}
            onChangeText={(value) => dispatch({ type: "draft", value })}
            style={s.input}
          />
          <Action
            disabled={!state.draft.trim()}
            onPress={() => dispatch({ type: "submit" })}
          >
            Send
          </Action>
          <Action selected={consent} onPress={() => setConsent(!consent)}>
            Manage consent and preferences
          </Action>
          {consent && (
            <View style={s.box}>
              <Text>
                Sharing with support is off. Only your chosen public topic is
                sent to MapAble when browsing pathways. Use your device display
                settings for text size and contrast.
              </Text>
              {state.demo && (
                <>
                  <Text>Doorway minimum in millimetres</Text>
                  <TextInput
                    accessibilityLabel="Doorway minimum in millimetres"
                    keyboardType="number-pad"
                    value={width}
                    onChangeText={setWidth}
                    style={s.input}
                  />
                  <Action
                    onPress={() => {
                      const n = parseWidth(width);
                      if (n === undefined) {
                        setMessage("Enter a whole number from 1 to 9999.");
                        return;
                      }
                      dispatch({ type: "minimum", value: n });
                      setMessage("Minimum applied.");
                    }}
                  >
                    Apply minimum
                  </Action>
                  <Action
                    onPress={() => {
                      dispatch({ type: "minimum", value: null });
                      setWidth("");
                      setMessage("Minimum removed.");
                    }}
                  >
                    Remove minimum
                  </Action>
                </>
              )}
              <Action onPress={reset}>Clear this search</Action>
            </View>
          )}
        </View>
        <View style={[s.column, s.results, wide && s.right]}>
          <Text accessibilityRole="header" style={s.title}>
            {state.demo ? "Access near St Ives" : "Search results"}
          </Text>
          {!state.demo ? (
            <>
              <Text>
                Compare fictional St Ives clinics or browse public MapAble
                pathways.
              </Text>
              <Action
                onPress={() => {
                  dispatch({ type: "example" });
                  setWidth("900");
                  setMessage("");
                }}
              >
                Open synthetic example
              </Action>
              {browse &&
                (!directory ? (
                  <Text>Loading public pathways…</Text>
                ) : directory.error ? (
                  <Action onPress={retry}>Directory unavailable · Retry</Action>
                ) : directory.hits.length ? (
                  directory.hits.map((h) => (
                    <View key={h.href}>
                      <Action onPress={() => open(h.href)}>{h.title}</Action>
                      <Text>{h.sourceLabel}</Text>
                    </View>
                  ))
                ) : (
                  <Text>No public pathways returned.</Text>
                ))}
              <Action onPress={() => open("/search")}>
                Open full public directory
              </Action>
            </>
          ) : (
            <>
              <Text accessibilityLiveRegion="polite">
                {state.minimum === null
                  ? "2 clinics · No doorway minimum"
                  : clinics.filter((c) => c.door >= state.minimum!).length +
                    " of 2 meet your " +
                    state.minimum +
                    " mm minimum."}{" "}
                {selected
                  ? "Selected clinic " + selected.id
                  : "No clinic selected"}
              </Text>
              <View style={s.controls}>
                {views.map((v) => (
                  <Action
                    key={v}
                    selected={state.view === v}
                    onPress={() => dispatch({ type: "view", value: v })}
                  >
                    {v}
                  </Action>
                ))}
              </View>
              <View style={s.controls}>
                <Text>Show clinics below minimum</Text>
                <Switch
                  accessibilityLabel="Show clinics below minimum"
                  value={state.alternatives}
                  onValueChange={(value) =>
                    dispatch({ type: "alternatives", value })
                  }
                />
              </View>
              {selected && state.view === "2D map" && (
                <>
                  <View style={s.map}>
                    <Image
                      accessible={false}
                      resizeMode="stretch"
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                      }}
                      source={
                        !transit
                          ? require("./assets/base.png")
                          : selected.id === 1
                            ? require("./assets/one.png")
                            : require("./assets/two.png")
                      }
                    />
                    {visible.map((c) => (
                      <View
                        key={c.id}
                        style={[s.marker, c.id === 1 ? s.first : s.second]}
                      >
                        <Action
                          selected={selected.id === c.id}
                          onPress={() =>
                            dispatch({ type: "select", value: c.id })
                          }
                        >
                          {"Clinic " + c.id}
                        </Action>
                      </View>
                    ))}
                  </View>
                  <Text>{selected.approach}</Text>
                  <Action
                    selected={transit}
                    onPress={() => setTransit(!transit)}
                  >
                    Transit path
                  </Action>
                  <Action
                    selected={alternativesNote}
                    onPress={() => setAlternativesNote(!alternativesNote)}
                  >
                    Sensory layer
                  </Action>
                  {alternativesNote && (
                    <Text>No sensory measurements are supplied.</Text>
                  )}
                </>
              )}
              {selected &&
                state.view === "3D floor plan" &&
                (selected.plan ? (
                  <>
                    <Image
                      source={require("./assets/clinic-one-plan.jpg")}
                      style={s.plan}
                      resizeMode="contain"
                      accessible
                      accessibilityLabel="Illustrative floor plan of clinic 1"
                    />
                    <Text>
                      Text directions. Enter at A, then pass reception to reach
                      the quiet room at B. The hoist is in the separate
                      treatment room.
                    </Text>
                  </>
                ) : (
                  <Text>
                    No floor plan supplied for clinic 2. Read its access notes
                    below.
                  </Text>
                ))}
              {visible.length === 0 && (
                <Text>
                  No example meets this width. Show alternatives or change your
                  minimum.
                </Text>
              )}
              {visible.map((c) => (
                <View key={c.id} style={s.box}>
                  <Action
                    selected={selected?.id === c.id}
                    onPress={() => dispatch({ type: "select", value: c.id })}
                  >
                    {c.id + " · " + c.name}
                  </Action>
                  <Text>
                    {c.door} mm · {comparison(c.door, state.minimum)}
                  </Text>
                  {(state.view === "List" || selected?.id === c.id) && (
                    <Text>
                      {c.approach} Quiet room{" "}
                      {c.quiet ? "listed" : "unavailable"}. Ceiling hoist
                      listed.
                    </Text>
                  )}
                </View>
              ))}
              <Text>
                {audit}. Width is the clear opening with the door open.
              </Text>
              <Action onPress={reset}>Leave example and clear search</Action>
            </>
          )}
        </View>
      </View>
      {!!message && (
        <Text accessibilityRole="alert" style={s.emphasis}>
          {message}
        </Text>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: "#fff" },
  heading: { fontSize: 30, color: "#0c1833", fontWeight: "700" },
  title: { fontSize: 24, color: "#0c1833", fontWeight: "700" },
  sub: { fontWeight: "700", fontSize: 18 },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  layout: { gap: 0 },
  wide: { flexDirection: "row" },
  column: { minWidth: 0, padding: 14, gap: 12, backgroundColor: "#f1f7f8" },
  left: { flex: 45 },
  right: { flex: 55 },
  results: { backgroundColor: "#ffffff" },
  button: {
    minHeight: 48,
    minWidth: 48,
    borderWidth: 1,
    borderColor: "#486c7b",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  buttonText: { color: "#0c1833", fontSize: 16, fontWeight: "600" },
  white: { color: "#fff" },
  chosen: { backgroundColor: "#005b7f" },
  disabled: { opacity: 0.6 },
  box: {
    gap: 8,
    borderWidth: 1,
    borderColor: "#819aa3",
    borderRadius: 8,
    padding: 12,
  },
  emphasis: { color: "#123b53", fontWeight: "700" },
  input: {
    borderColor: "#486c7b",
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    color: "#0c1833",
    padding: 10,
    fontSize: 18,
    backgroundColor: "#fff",
  },
  phrases: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { flexBasis: "47%", flexGrow: 1 },
  plan: { width: "100%", height: 220, backgroundColor: "#0c1833" },
  map: { width: "100%", height: 210, overflow: "hidden" },
  marker: { position: "absolute" },
  first: { left: "51%", top: "23%" },
  second: { right: "3%", top: "62%" },
});
