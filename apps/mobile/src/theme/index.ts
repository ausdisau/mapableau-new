
import { darkTheme, lightTheme, type MapableTheme } from "@mapable/design-tokens";
import { useColorScheme } from "react-native";

export function useMapableTheme(): MapableTheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}

export { lightTheme, darkTheme };
