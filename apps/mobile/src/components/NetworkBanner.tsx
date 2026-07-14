import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export function NetworkBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);
  if (!offline) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: "#F8C51C", padding: 10 }}
    >
      <Text style={{ fontWeight: "700" }}>
        You are offline. Showing protected summaries only. Actions will sync when connected and must be revalidated by MapAble.
      </Text>
    </View>
  );
}
