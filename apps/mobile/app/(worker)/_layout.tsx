import { Tabs } from "expo-router";
import { workerTabs } from "@/navigation/role-navigation";
export default function Layout() {
  return (
    <Tabs>
      {workerTabs().map((t) => (
        <Tabs.Screen key={t.key} name={t.key} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
