import { Tabs } from "expo-router";
import { coordinatorTabs } from "@/navigation/role-navigation";
export default function Layout() {
  return (
    <Tabs>
      {coordinatorTabs().map((t) => (
        <Tabs.Screen key={t.key} name={t.key} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
