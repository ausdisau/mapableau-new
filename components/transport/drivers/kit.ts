import type { ComponentType, ReactNode } from "react";

import type { Corridor } from "../../../lib/transport/driver-practice/journey";

export const colour = {
  ink: "#0C1833",
  blue: "#005B7F",
  muted: "#475D6B",
  pale: "#E6F3F3",
  line: "#CBD9DE",
  paper: "#F4F8F8",
  white: "#FFFFFF",
  hero: "#0C293A",
  aqua: "#A9EADD",
  lime: "#F8C51C",
  danger: "#963C30",
};
export type IconName =
  | "wheel"
  | "route"
  | "clock"
  | "calendar"
  | "arrow"
  | "chevron"
  | "back"
  | "support"
  | "shield"
  | "check"
  | "pin"
  | "list"
  | "external"
  | "van"
  | "user"
  | "flag"
  | "info"
  | "pause"
  | "refresh"
  | "message"
  | "globe";
export type BoxProps = {
  children?: ReactNode;
  row?: boolean;
  wrap?: boolean;
  gap?: number;
  pad?: number;
  grow?: number;
  bg?: string;
  border?: string;
  radius?: number;
  align?: "center" | "stretch" | "flex-start" | "flex-end";
  justify?: "center" | "space-between" | "flex-start";
  min?: number;
  max?: number;
  basis?: number;
  full?: boolean;
  top?: number;
  stretch?: boolean;
};
export type TextProps = {
  children: ReactNode;
  kind?:
    | "title"
    | "hero"
    | "heading"
    | "label"
    | "body"
    | "small"
    | "time"
    | "sub"
    | "number";
  color?: string;
  bold?: boolean;
  semantic?: "h1" | "h2" | "h3" | "status";
};
export type TapProps = {
  children: ReactNode;
  label: string;
  onPress: () => void;
  tone?:
    | "primary"
    | "bright"
    | "plain"
    | "light"
    | "dark"
    | "link"
    | "danger"
    | "row"
    | "nav";
  selected?: boolean;
  disabled?: boolean;
  check?: boolean;
  checked?: boolean;
};
export interface DriverUI {
  Box: ComponentType<BoxProps>;
  T: ComponentType<TextProps>;
  Tap: ComponentType<TapProps>;
  Icon: ComponentType<{ name: IconName; color?: string; size?: number }>;
  Mark: ComponentType;
  Diagram: ComponentType<{ corridor: Corridor }>;
  useNarrow: () => boolean;
  load: () => Promise<string | null>;
  save: (s: string) => Promise<void>;
  open: (
    path:
      | "/transport"
      | "/transport/driver"
      | "/contact"
      | "/"
      | "/help"
      | "/transport/drivers/assigned",
  ) => Promise<void>;
  refreshEstimate: (corridor: Corridor) => Promise<{
    distanceMetres: number;
    durationSeconds: number;
    generatedAt: string;
    validUntil: string;
  }>;
  focusPage: () => void;
}
export const font = {
  title: [36, 43, 800],
  hero: [30, 36, 800],
  heading: [22, 28, 750],
  label: [12, 18, 750],
  body: [16, 24, 400],
  small: [14, 21, 400],
  time: [20, 26, 750],
  sub: [17, 23, 700],
  number: [29, 33, 800],
} as const;
export function boxStyle(p: BoxProps) {
  return {
    display: "flex",
    flexDirection: p.row ? "row" : "column",
    flexWrap: p.wrap ? "wrap" : "nowrap",
    gap: p.gap ?? 0,
    padding: p.pad ?? 0,
    flexGrow: p.grow ?? 0,
    flexShrink: 1,
    flexBasis: p.basis,
    backgroundColor: p.bg,
    borderWidth: p.border ? 1 : 0,
    borderColor: p.border,
    borderRadius: p.radius,
    alignItems: p.align ?? "stretch",
    justifyContent: p.justify ?? "flex-start",
    minWidth: p.min ?? 0,
    maxWidth: p.max,
    width: p.full ? "100%" : undefined,
    marginTop: p.top,
    alignSelf: p.stretch ? "stretch" : undefined,
  } as const;
}
export function buttonColours(t: TapProps["tone"], selected?: boolean) {
  if (t === "primary") return [colour.blue, colour.white, colour.blue];
  if (t === "bright") return [colour.lime, colour.ink, colour.lime];
  if (t === "dark") return [colour.hero, colour.white, "#66828D"];
  if (t === "danger") return ["#FFF6F3", colour.danger, "#D7AAA4"];
  if (t === "nav" && selected) return [colour.pale, colour.blue, colour.pale];
  if (t === "light") return [colour.white, colour.blue, colour.line];
  return ["transparent", colour.blue, "transparent"];
}
