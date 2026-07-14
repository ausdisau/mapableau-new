import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";

export default function AuthCallback() {
  const auth = useAuth();
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) void auth.handleAuthRedirect(url);
    });
  }, [auth]);
  if (auth.authenticated) return <Redirect href="/(participant)/today" />;
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator accessibilityLabel="Completing sign in" />
    </View>
  );
}
