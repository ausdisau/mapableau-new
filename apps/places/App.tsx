import React from "react";
import { useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { CatalogProvider } from "./src/catalog";
import { CommunityScreen } from "./src/CommunityScreen";
import { ContributeScreen } from "./src/ContributeScreen";
import { ExploreScreen } from "./src/ExploreScreen";
import { PrivacyScreen } from "./src/PrivacyScreen";
import { SavedScreen } from "./src/SavedScreen";
import { SupportSearchScreen } from "./src/SupportSearchScreen";
import { PlacesProvider } from "./src/store";
import { COLORS } from "./src/ui";

const Tab = createBottomTabNavigator();

function PlacesNavigation() {
  const { width } = useWindowDimensions();
  const desktop = width >= 950;

  return <Tab.Navigator initialRouteName="Places" screenOptions={{
    headerStyle: { backgroundColor: COLORS.white },
    headerTitleStyle: { fontSize: 18, fontWeight: "800", color: COLORS.navy },
    headerTintColor: COLORS.navy,
    tabBarPosition: desktop ? "left" : "bottom",
    tabBarVariant: desktop ? "material" : "uikit",
    tabBarLabelStyle: { fontSize: 13, fontWeight: "700" },
    tabBarItemStyle: { minHeight: 48, justifyContent: "center" },
    tabBarStyle: {
      backgroundColor: COLORS.white,
      borderTopColor: COLORS.border,
      borderRightColor: COLORS.border,
      ...(desktop ? { width: 170 } : { height: 71 }),
    },
    tabBarActiveTintColor: COLORS.navy,
    tabBarInactiveTintColor: COLORS.secondary,
    tabBarActiveBackgroundColor: COLORS.soft,
    sceneStyle: { backgroundColor: COLORS.bg },
  }}>
    <Tab.Screen name="Places" component={ExploreScreen} options={{title:"Discover places",tabBarLabel:"Places"}}/>
    <Tab.Screen name="Supports" component={SupportSearchScreen} options={{title:"Find care and support",tabBarLabel:"Supports"}}/>
    <Tab.Screen name="Saved" component={SavedScreen} options={{title:"My private places",tabBarLabel:"Saved"}}/>
    <Tab.Screen name="Community" component={CommunityScreen} options={{title:"CripSquare community prototype",tabBarLabel:"Community"}}/>
    <Tab.Screen name="Contribute" component={ContributeScreen} options={{title:"Contribute access knowledge",tabBarLabel:"Contribute"}}/>
    <Tab.Screen name="Privacy" component={PrivacyScreen} options={{title:"Privacy and accessibility",tabBarLabel:"Privacy"}}/>
  </Tab.Navigator>;
}

export default function App() {
  return <PlacesProvider>
    <CatalogProvider>
      <StatusBar style="dark"/>
      <NavigationContainer>
        <PlacesNavigation/>
      </NavigationContainer>
    </CatalogProvider>
  </PlacesProvider>;
}
