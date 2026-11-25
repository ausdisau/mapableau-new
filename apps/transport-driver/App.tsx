import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flag,
  Globe,
  Headphones,
  Info,
  List,
  MapPin,
  MessageSquare,
  Navigation,
  Pause,
  RefreshCw,
  Route,
  ShieldCheck,
  Square,
  SquareCheck,
  UserRound,
} from "lucide-react-native";
import { DriverDesk } from "../../components/transport/drivers/DriverDesk";
import {
  boxStyle,
  buttonColours,
  colour,
  font,
} from "../../components/transport/drivers/kit";
import type { DriverUI } from "../../components/transport/drivers/kit";
import { fetchPracticeEstimate } from "../../lib/transport/driver-practice/estimate-client";

// Expo replaces this public setting when bundling for native or web.
declare const process: {
  env: { EXPO_PUBLIC_MAPABLE_PRACTICE_API_ORIGIN?: string };
};

const icons = {
  wheel: Navigation,
  route: Route,
  clock: Clock3,
  calendar: CalendarDays,
  arrow: ArrowRight,
  chevron: ChevronRight,
  back: ArrowLeft,
  support: Headphones,
  shield: ShieldCheck,
  check: Check,
  pin: MapPin,
  list: List,
  external: ExternalLink,
  van: BusFront,
  user: UserRound,
  flag: Flag,
  info: Info,
  pause: Pause,
  refresh: RefreshCw,
  message: MessageSquare,
  globe: Globe,
};
const images = {
  "park-aquatic": require("../../public/driver-routes/park-aquatic.png"),
  "aquatic-park": require("../../public/driver-routes/aquatic-park.png"),
  "park-library": require("../../public/driver-routes/park-library.png"),
};
const key = "mapable.drivers.practice.v1";
const origin = "https://mapable.com.au";
const practiceApiOrigin = (
  process.env.EXPO_PUBLIC_MAPABLE_PRACTICE_API_ORIGIN?.trim() || origin
).replace(/\/+$/, "");
const heading: { current: React.ComponentRef<typeof Text> | null } = {
  current: null,
};
const scroll: { current: ScrollView | null } = { current: null };
const ui: DriverUI = {
  Box: (p) => <View style={boxStyle(p)}>{p.children}</View>,
  T: ({
    children,
    kind = "body",
    color = colour.ink,
    bold,
    semantic: role,
  }) => {
    const [size, lh, w] = font[kind];
    const isHeading = role?.startsWith("h");
    useEffect(() => {
      if (
        Platform.OS === "ios" &&
        role === "status" &&
        typeof children === "string"
      )
        AccessibilityInfo.announceForAccessibility(children);
    }, [role, children]);
    return (
      <Text
        ref={
          role === "h1"
            ? (el) => {
                heading.current = el;
              }
            : undefined
        }
        accessibilityRole={isHeading ? "header" : undefined}
        aria-level={isHeading ? Number(role!.slice(1)) : undefined}
        accessibilityLiveRegion={role === "status" ? "polite" : undefined}
        style={{
          fontSize: size,
          lineHeight: lh,
          fontWeight: bold || w >= 700 ? (w >= 800 ? "800" : "700") : "400",
          color,
          letterSpacing:
            kind === "label"
              ? 0.6
              : kind === "title" || kind === "hero"
                ? -1
                : 0,
          flexShrink: 1,
        }}
      >
        {children}
      </Text>
    );
  },
  Tap: ({
    children,
    label,
    onPress,
    disabled,
    tone = "light",
    check,
    checked,
    selected,
  }) => {
    const [bg, , border] = buttonColours(tone, selected);
    const row = tone === "row";
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole={check ? "checkbox" : "button"}
        accessibilityState={{
          disabled: !!disabled,
          checked: check ? checked : undefined,
          selected,
        }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: row ? "flex-start" : "center",
          gap: 9,
          minHeight: 48,
          minWidth: 48,
          maxWidth: "100%",
          paddingVertical: 9,
          paddingHorizontal: row ? 3 : 13,
          borderWidth: 1,
          borderColor: border,
          borderBottomColor: row ? colour.line : border,
          borderRadius: row ? 0 : 10,
          backgroundColor: bg,
        })}
      >
        {check &&
          (checked ? (
            <SquareCheck size={20} color={colour.blue} />
          ) : (
            <Square size={20} color={colour.blue} />
          ))}
        {children}
      </Pressable>
    );
  },
  Icon: ({ name, color = colour.ink, size = 19 }) => {
    const I = icons[name];
    return (
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      >
        <I size={size} color={color} />
      </View>
    );
  },
  Mark: () => (
    <Image
      source={require("./assets/mapable-mark.png")}
      style={{ width: 42, height: 46 }}
      accessible={false}
    />
  ),
  Diagram: ({ corridor }) => (
    <Image
      source={images[corridor]}
      resizeMode="contain"
      style={{ width: "100%", aspectRatio: 920 / 384, borderRadius: 12 }}
      accessible={false}
    />
  ),
  useNarrow: () => {
    const w = useWindowDimensions();
    return w.width / w.fontScale <= 740;
  },
  load: () => AsyncStorage.getItem(key),
  save: (s) => AsyncStorage.setItem(key, s),
  open: async (path) => {
    if (Platform.OS === "web") {
      window.location.assign(origin + path);
      return;
    }
    await WebBrowser.openBrowserAsync(origin + path);
  },
  refreshEstimate: (corridor) =>
    fetchPracticeEstimate(practiceApiOrigin, corridor),
  focusPage: () =>
    requestAnimationFrame(() => {
      scroll.current?.scrollTo({ y: 0, animated: false });
      if (Platform.OS === "web") {
        (heading.current as unknown as { focus?: () => void })?.focus?.();
      } else if (heading.current) {
        const tag = findNodeHandle(heading.current);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }
    }),
};
export default function App() {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current = ref.current;
    return () => {
      scroll.current = null;
    };
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.fill}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          ref={ref}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <DriverDesk ui={ui} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colour.paper },
  scroll: { alignItems: "stretch" },
});
