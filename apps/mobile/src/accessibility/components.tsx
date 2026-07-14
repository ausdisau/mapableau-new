import React, { useState } from "react";
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import {
  DEFAULT_A11Y_PREFERENCES,
  minTouchTarget,
  PLAIN_LANGUAGE_STATUS,
  scaleFontSize,
  statusWithoutColourOnly,
  type AccessibilityPreferences,
} from "@mapable/accessibility";
import { useMapableTheme } from "@/theme";

type Prefs = AccessibilityPreferences;

function usePrefs(prefs?: Prefs): Prefs {
  return prefs ?? DEFAULT_A11Y_PREFERENCES;
}

export function AccessibleButton({
  label,
  onPress,
  disabled,
  prefs,
  hint,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  prefs?: Prefs;
  hint?: string;
}) {
  const theme = useMapableTheme();
  const p = usePrefs(prefs);
  const size = minTouchTarget(p);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: size,
          backgroundColor: theme.colors.primary,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: scaleFontSize(theme.typography.sizes.md, p),
          fontWeight: p.boldText ? "700" : "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AccessibleField({
  label,
  value,
  onChangeText,
  error,
  prefs,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  prefs?: Prefs;
} & Omit<TextInputProps, "value" | "onChangeText">) {
  const theme = useMapableTheme();
  const p = usePrefs(prefs);
  const fieldId = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <View style={{ gap: 6 }}>
      <Text
        nativeID={`${fieldId}-label`}
        style={{
          color: theme.colors.foreground,
          fontSize: scaleFontSize(theme.typography.sizes.sm, p),
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.border}
        style={{
          minHeight: minTouchTarget(p),
          borderWidth: 1,
          borderColor: error ? theme.colors.destructive : theme.colors.border,
          borderRadius: theme.radii.md,
          paddingHorizontal: theme.spacing.md,
          color: theme.colors.foreground,
          fontSize: scaleFontSize(theme.typography.sizes.md, p),
          backgroundColor: theme.colors.card,
        }}
        {...rest}
      />
      {error ? (
        <Text
          nativeID={`${fieldId}-error`}
          accessibilityRole="alert"
          style={{ color: theme.colors.destructive }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AccessibleCheckbox({
  label,
  checked,
  onChange,
  prefs,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  prefs?: Prefs;
}) {
  const theme = useMapableTheme();
  const p = usePrefs(prefs);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={{
        minHeight: minTouchTarget(p),
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderWidth: 2,
          borderColor: theme.colors.primary,
          backgroundColor: checked ? theme.colors.primary : "transparent",
        }}
      />
      <Text style={{ color: theme.colors.foreground, fontSize: scaleFontSize(16, p) }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AccessibleRadioGroup({
  legend,
  options,
  value,
  onChange,
  prefs,
}: {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  prefs?: Prefs;
}) {
  const theme = useMapableTheme();
  const p = usePrefs(prefs);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={legend} style={{ gap: 8 }}>
      <Text style={{ fontWeight: "700", color: theme.colors.foreground }}>{legend}</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          accessibilityRole="radio"
          accessibilityLabel={opt.label}
          accessibilityState={{ selected: value === opt.value }}
          onPress={() => onChange(opt.value)}
          style={{ minHeight: minTouchTarget(p), justifyContent: "center" }}
        >
          <Text style={{ color: theme.colors.foreground }}>
            {value === opt.value ? "● " : "○ "}
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function AccessibleSegmentedControl({
  label,
  segments,
  value,
  onChange,
  prefs,
}: {
  label: string;
  segments: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  prefs?: Prefs;
}) {
  const theme = useMapableTheme();
  const p = usePrefs(prefs);
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ gap: 8 }}>
      <Text style={{ fontWeight: "700", color: theme.colors.foreground }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {segments.map((seg) => (
          <Pressable
            key={seg.value}
            accessibilityRole="tab"
            accessibilityLabel={seg.label}
            accessibilityState={{ selected: value === seg.value }}
            onPress={() => onChange(seg.value)}
            style={{
              minHeight: minTouchTarget(p),
              paddingHorizontal: 14,
              justifyContent: "center",
              borderRadius: theme.radii.sm,
              backgroundColor:
                value === seg.value ? theme.colors.primary : theme.colors.muted,
            }}
          >
            <Text
              style={{
                color: value === seg.value ? "#fff" : theme.colors.foreground,
                fontWeight: "600",
              }}
            >
              {seg.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function AccessibleDialog({
  visible,
  title,
  children,
  onClose,
  prefs,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  prefs?: Prefs;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalBackdrop}>
        <View
          accessibilityRole="summary"
          accessibilityLabel={title}
          style={styles.modalCard}
        >
          <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: "700" }}>
            {title}
          </Text>
          {children}
          <AccessibleButton label="Close" onPress={onClose} prefs={prefs} />
        </View>
      </View>
    </Modal>
  );
}

export function AccessibleBottomSheet({
  visible,
  title,
  children,
  onClose,
  prefs,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  prefs?: Prefs;
}) {
  return (
    <AccessibleDialog visible={visible} title={title} onClose={onClose} prefs={prefs}>
      {children}
    </AccessibleDialog>
  );
}

export function AccessibleStatus({
  label,
  tone,
  live = "polite",
}: {
  label: string;
  tone: string;
  live?: "polite" | "assertive";
}) {
  const text = statusWithoutColourOnly(label, tone);
  React.useEffect(() => {
    AccessibilityInfo.announceForAccessibility(text);
  }, [text]);
  return (
    <Text
      accessibilityRole="text"
      accessibilityLiveRegion={live}
      style={{ fontWeight: "600" }}
    >
      {text}
    </Text>
  );
}

export function AccessibleErrorSummary({
  errors,
  title = "Please fix these items",
}: {
  errors: string[];
  title?: string;
}) {
  if (!errors.length) return null;
  return (
    <View accessibilityRole="alert" style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ fontWeight: "700" }}>
        {title}
      </Text>
      {errors.map((err) => (
        <Text key={err}>• {err}</Text>
      ))}
    </View>
  );
}

export function AccessibleTimeline({
  items,
}: {
  items: { id: string; title: string; detail: string; status: string }[];
}) {
  return (
    <View accessibilityRole="list" style={{ gap: 12 }}>
      {items.map((item) => (
        <View key={item.id} accessible accessibilityLabel={`${item.title}. ${item.detail}. ${PLAIN_LANGUAGE_STATUS[item.status] ?? item.status}`}>
          <Text style={{ fontWeight: "700" }}>{item.title}</Text>
          <Text>{item.detail}</Text>
          <Text>{PLAIN_LANGUAGE_STATUS[item.status] ?? item.status}</Text>
        </View>
      ))}
    </View>
  );
}

export function AccessibleEvidenceCard({
  title,
  summary,
  provenance,
  observedAt,
  confidence,
}: {
  title: string;
  summary: string;
  provenance: string;
  observedAt: string | null;
  confidence: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}. Source: ${provenance.replace(/_/g, " ")}. Confidence: ${confidence}. ${summary}`}
      style={styles.card}
    >
      <Text style={{ fontWeight: "700" }}>{title}</Text>
      <Text>Source: {provenance.replace(/_/g, " ")}</Text>
      <Text>Confidence: {confidence}</Text>
      {observedAt ? <Text>Observed: {observedAt}</Text> : <Text>Observed date unknown</Text>}
      <Text>{summary}</Text>
    </View>
  );
}

export function AccessibleConfirmationCard({
  title,
  explanation,
  domain,
  onConfirm,
  onDecline,
  prefs,
}: {
  title: string;
  explanation: string;
  domain: "care" | "transport";
  onConfirm: () => void;
  onDecline: () => void;
  prefs?: Prefs;
}) {
  return (
    <View style={styles.card} accessibilityLabel={`${title}. ${explanation}`}>
      <Text accessibilityRole="header" style={{ fontWeight: "700" }}>
        Confirm {domain === "care" ? "Care" : "Transport"} separately
      </Text>
      <Text>{title}</Text>
      <Text>{explanation}</Text>
      <AccessibleButton label={`Confirm ${domain}`} onPress={onConfirm} prefs={prefs} />
      <AccessibleButton label="Decline" onPress={onDecline} prefs={prefs} />
    </View>
  );
}

export function AccessibleMapAlternative({
  places,
  onSelect,
}: {
  places: { id: string; name: string; summary: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <View accessibilityRole="list" style={{ gap: 8 }}>
      <Text accessibilityRole="header">List view of places</Text>
      {places.map((place) => (
        <Pressable
          key={place.id}
          accessibilityRole="button"
          accessibilityLabel={`${place.name}. ${place.summary}`}
          onPress={() => onSelect(place.id)}
          style={styles.card}
        >
          <Text style={{ fontWeight: "700" }}>{place.name}</Text>
          <Text>{place.summary}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function AACPromptGrid({
  prompts,
  onSelect,
  prefs,
}: {
  prompts: { id: string; label: string }[];
  onSelect: (id: string) => void;
  prefs?: Prefs;
}) {
  const p = usePrefs(prefs);
  return (
    <View accessibilityRole="menu" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {prompts.map((prompt) => (
        <Pressable
          key={prompt.id}
          accessibilityRole="menuitem"
          accessibilityLabel={prompt.label}
          onPress={() => onSelect(prompt.id)}
          style={{
            minHeight: minTouchTarget(p),
            minWidth: 120,
            padding: 12,
            backgroundColor: "#E8F1F5",
            borderRadius: 10,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "600" }}>{prompt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PlainLanguageToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <Text>Plain language</Text>
      <Switch
        accessibilityLabel="Plain language mode"
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#C9D8E0",
    borderRadius: 10,
    padding: 12,
    gap: 6,
    backgroundColor: "#fff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
});
