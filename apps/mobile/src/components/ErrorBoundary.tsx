import React from "react";
import { Text, View } from "react-native";
import { AccessibleButton } from "@/accessibility";

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  State
> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something went wrong" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 12 }}>
          <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: "700" }}>
            MapAble hit a problem
          </Text>
          <Text accessibilityRole="alert">{this.state.message}</Text>
          <AccessibleButton
            label="Try again"
            onPress={() => {
              this.setState({ hasError: false, message: "" });
              this.props.onReset?.();
            }}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
