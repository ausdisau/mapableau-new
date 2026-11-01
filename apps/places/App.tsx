import React from "react";
import { useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { CatalogProvider } from "./src/catalog";
import { ExploreScreen } from "./src/ExploreScreen";
import { HomeScreen } from "./src/HomeScreen";
import { MoreScreen } from "./src/MoreScreen";
import { ProvidersScreen } from "./src/ProvidersScreen";
import { SavedScreen } from "./src/SavedScreen";
import { PlacesProvider } from "./src/store";
import { COLORS } from "./src/ui";

type MapAbleTabs = {
  Home: undefined;
  Support: undefined;
  Places: undefined;
  Saved: undefined;
  More: undefined;
};
const Tab = createBottomTabNavigator<MapAbleTabs>();

function MapAbleNavigation() {
  const { width } = useWindowDimensions();
  const desktop = width >= 950;

  return <Tab.Navigator initialRouteName="Home" screenOptions={{
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
    <Tab.Screen name="Home" options={{title:"MapAble overview",tabBarLabel:"Home"}}>
      {({ navigation }) => <HomeScreen onOpen={destination => navigation.navigate(destination)}/>}
    </Tab.Screen>
    <Tab.Screen name="Support" component={ProvidersScreen} options={{title:"Find care and support",tabBarLabel:"Care"}}/>
    <Tab.Screen name="Places" component={ExploreScreen} options={{title:"Discover places",tabBarLabel:"Places"}}/>
    <Tab.Screen name="Saved" component={SavedScreen} options={{title:"My private places",tabBarLabel:"Saved"}}/>
    <Tab.Screen name="More" component={MoreScreen} options={{title:"More MapAble modules",tabBarLabel:"More"}}/>
  </Tab.Navigator>;
}

export default function App() {
  return <PlacesProvider>
    <CatalogProvider>
      <StatusBar style="dark"/>
      <NavigationContainer>
        <MapAbleNavigation/>
      </NavigationContainer>
    </CatalogProvider>
  </PlacesProvider>;
}
