import React from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, useWindowDimensions, type TextInputProps, type ViewStyle,
} from "react-native";

export const COLORS = {
  navy: "#082C45", cyan: "#005F77", text: "#112533",
  secondary: "#384D5B", muted: "#566371", bg: "#F3F7F8",
  white: "#FFFFFF", border: "#B8C6CB", soft: "#E7F1F3",
  warning: "#7B3F00", warningBg: "#FFF2D9", danger: "#862929",
  success: "#156446", successBg: "#E5F7EB",
};

export const S = StyleSheet.create({
  background: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 45, gap: 16, alignSelf: "center", width: "100%", maxWidth: 940 },
  hero: { backgroundColor: COLORS.navy, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 28, gap: 9 },
  heroTitle: { color: COLORS.white, fontSize: 30, fontWeight: "800", lineHeight: 39 },
  heroSubtitle: { color: "#F2FAFF", fontSize: 17, lineHeight: 26 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "800", lineHeight: 37 },
  heading: { color: COLORS.text, fontSize: 21, fontWeight: "800", lineHeight: 29 },
  subheading: { color: COLORS.text, fontSize: 18, fontWeight: "700", lineHeight: 26 },
  body: { color: COLORS.text, fontSize: 16, lineHeight: 25 },
  muted: { color: COLORS.secondary, fontSize: 15, lineHeight: 23 },
  small: { color: COLORS.secondary, fontSize: 14, lineHeight: 22 },
  eyebrow: { color: COLORS.cyan, fontSize: 13, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  card: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, borderColor: "#657A84", borderWidth: 1, paddingHorizontal: 15, paddingVertical: 13, minHeight: 52, fontSize: 17, lineHeight: 25, color: COLORS.text },
  textArea: { minHeight: 130, textAlignVertical: "top" },
  field: { gap: 7 },
  label: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  button: { minHeight: 50, minWidth: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 11, borderWidth: 2, borderColor: COLORS.cyan, backgroundColor: COLORS.white },
  buttonPrimary: { backgroundColor: COLORS.cyan },
  buttonDanger: { borderColor: COLORS.danger },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, lineHeight: 23, fontWeight: "800", color: COLORS.cyan, textAlign: "center" },
  buttonTextPrimary: { color: COLORS.white },
  buttonTextDanger: { color: COLORS.danger },
  chip: { borderWidth: 1, borderColor: "#647E88", backgroundColor: COLORS.white, minHeight: 45, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 14, justifyContent: "center" },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy, fontWeight: "700", fontSize: 15 },
  chipTextActive: { color: COLORS.white },
  notice: { backgroundColor: COLORS.soft, borderRadius: 13, borderLeftWidth: 5, borderLeftColor: COLORS.cyan, padding: 16, gap: 6 },
  warn: { backgroundColor: COLORS.warningBg, borderLeftColor: COLORS.warning },
  error: { backgroundColor: "#FFF0EF", borderLeftColor: COLORS.danger },
  success: { backgroundColor: COLORS.successBg, borderLeftColor: COLORS.success },
  linkText: { color: COLORS.cyan, fontSize: 16, fontWeight: "700", textDecorationLine: "underline" },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
});

export function Screen({ children }: { children: React.ReactNode }) {
  const dim = useWindowDimensions();
  const pad: ViewStyle = { paddingHorizontal: dim.width < 350 ? 12 : 18 };
  return <ScrollView
    style={S.background}
    contentContainerStyle={[S.container, pad]}
    contentInsetAdjustmentBehavior="automatic"
    keyboardShouldPersistTaps="handled"
  >{children}</ScrollView>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={S.card}>{children}</View>;
}

export function Heading({ children, level = 1 }: { children: React.ReactNode; level?: 1 | 2 | 3 }) {
  return <Text accessibilityRole="header" style={level === 1 ? S.title : level === 2 ? S.heading : S.subheading}>{children}</Text>;
}

export function Notice({
  children, kind = "info", live = false,
}: {
  children: React.ReactNode; kind?: "info" | "warn" | "error" | "success"; live?: boolean;
}) {
  return <View style={[S.notice, kind === "warn" && S.warn, kind === "error" && S.error, kind === "success" && S.success]}
    accessibilityLiveRegion={live ? "polite" : "none"}>
    <Text style={S.body}>{children}</Text>
  </View>;
}

export function Action({
  label, onPress, primary = false, danger = false, disabled = false,
  hint, selected,
}: {
  label: string; onPress: () => void; primary?: boolean; danger?: boolean;
  disabled?: boolean; hint?: string; selected?: boolean;
}) {
  const [hasFocus, setHasFocus] = React.useState(false);
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
    accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }}
    disabled={disabled}
    onFocus={() => setHasFocus(true)}
    onBlur={() => setHasFocus(false)}
    onPress={onPress}
    style={({ pressed }) => [S.button, primary && S.buttonPrimary, danger && S.buttonDanger,
      disabled && S.buttonDisabled, pressed && !disabled && { opacity: 0.8 },
      hasFocus && { borderWidth: 3, borderColor: "#E5A500" }]}
  ><Text style={[S.buttonText, primary && S.buttonTextPrimary, danger && !primary && S.buttonTextDanger]}>{label}</Text></Pressable>;
}

function RadioOption<T extends string>({
  option, selected, onSelect,
}: {
  option: { value: T; label: string }; selected: boolean; onSelect: (value: T) => void;
}) {
  const [hasFocus, setHasFocus] = React.useState(false);
  return <Pressable onPress={() => onSelect(option.value)}
    accessibilityRole="radio" accessibilityLabel={option.label}
    accessibilityState={{ checked: selected }}
    onFocus={() => setHasFocus(true)}
    onBlur={() => setHasFocus(false)}
    style={[S.chip, selected && S.chipActive, hasFocus && { borderWidth: 3, borderColor: "#B36A00" }]}>
    <Text style={[S.chipText, selected && S.chipTextActive]}>{option.label}</Text>
  </Pressable>;
}

export function Choice<T extends string>({
  label, options, value, onChange,
}: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void;
}) {
  return <View style={S.field}>
    <Text style={S.label}>{label}</Text>
    <View style={S.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(option => <RadioOption key={option.value}
        option={option} selected={value === option.value} onSelect={onChange}/>)}
    </View>
  </View>;
}

export function Field({
  label, help, multiline, ...rest
}: TextInputProps & { label: string; help?: string; multiline?: boolean }) {
  return <View style={S.field}>
    <Text style={S.label}>{label}</Text>
    {help ? <Text style={S.small}>{help}</Text> : null}
    <TextInput
      accessibilityLabel={label}
      accessibilityHint={help}
      placeholderTextColor={COLORS.secondary}
      multiline={multiline}
      style={[S.input, multiline && S.textArea]}
      {...rest}
    />
  </View>;
}
