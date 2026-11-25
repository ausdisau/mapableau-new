"use client";
import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  CheckSquare,
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
  UserRound,
} from "lucide-react";
import React, { useSyncExternalStore } from "react";

import { fetchPracticeEstimate } from "../../../lib/transport/driver-practice/estimate-client";

import styles from "./driver.module.css";
import { DriverDesk } from "./DriverDesk";
import { boxStyle, buttonColours, colour, font } from "./kit";
import type { DriverUI, IconName } from "./kit";

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
} satisfies Record<IconName, unknown>;
const key = "mapable.drivers.practice.v1";
function subscribe(cb: () => void) {
  const m = window.matchMedia("(max-width: 740px)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const ui: DriverUI = {
  Box: (p) => (
    <div
      style={{ ...boxStyle(p), borderStyle: "solid", boxSizing: "border-box" }}
    >
      {p.children}
    </div>
  ),
  T: ({
    children,
    kind = "body",
    color = colour.ink,
    bold,
    semantic: role,
  }) => {
    const [size, line, weight] = font[kind];
    const El = role?.startsWith("h") ? (role as "h1" | "h2" | "h3") : "span";
    return (
      <El
        data-driver-heading={role === "h1" ? "true" : undefined}
        tabIndex={role === "h1" ? -1 : undefined}
        role={role === "status" ? "status" : undefined}
        style={{
          margin: 0,
          color,
          fontSize: size / 16 + "rem",
          lineHeight: line / size,
          fontWeight: bold ? 750 : weight,
          letterSpacing:
            kind === "label"
              ? "0.045em"
              : kind === "title" || kind === "hero"
                ? "-0.035em"
                : undefined,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </El>
    );
  },
  Tap: ({
    children,
    onPress,
    tone = "light",
    disabled,
    selected,
    check,
    checked,
  }) => {
    const [backgroundColor, color, borderColor] = buttonColours(tone, selected);
    const row = tone === "row";
    return (
      <button
        type="button"
        className={styles.tap}
        disabled={disabled}
        role={check ? "checkbox" : undefined}
        aria-checked={check ? checked : undefined}
        aria-current={selected ? "page" : undefined}
        onClick={onPress}
        style={{
          backgroundColor,
          color,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor,
          justifyContent: row ? "flex-start" : "center",
          textAlign: row ? "left" : "center",
          padding: row ? "9px 3px" : "9px 13px",
          width: row ? "100%" : undefined,
          borderBottomColor: row ? colour.line : borderColor,
          borderRadius: row ? 0 : 10,
        }}
      >
        {check &&
          (checked ? (
            <CheckSquare size={20} aria-hidden />
          ) : (
            <Square size={20} aria-hidden />
          ))}
        {children}
      </button>
    );
  },
  Icon: ({ name, color = colour.ink, size = 19 }) => {
    const I = icons[name];
    return (
      <I
        size={size}
        color={color}
        strokeWidth={2}
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
    );
  },
  Mark: () => (
    <img src="/brand/mapable-logo-mark.svg" alt="" width={42} height={46} />
  ),
  Diagram: ({ corridor }) => (
    <img
      src={"/driver-routes/" + corridor + ".png"}
      alt=""
      width={920}
      height={384}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        borderRadius: 12,
      }}
    />
  ),
  useNarrow: () =>
    useSyncExternalStore(
      subscribe,
      () => window.matchMedia("(max-width: 740px)").matches,
      () => true,
    ),
  load: async () => localStorage.getItem(key),
  save: async (s) => {
    localStorage.setItem(key, s);
  },
  open: async (path) => {
    window.location.assign(path);
  },
  refreshEstimate: (corridor) => fetchPracticeEstimate("", corridor),
  focusPage: () =>
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('[data-driver-heading="true"]')
        ?.focus(),
    ),
};
export default function DriverWeb() {
  return (
    <div className={styles.desk}>
      <DriverDesk ui={ui} />
    </div>
  );
}
