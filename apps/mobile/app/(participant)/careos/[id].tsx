import { useLocalSearchParams } from "expo-router";
import { MissionDetailScreen } from "@/features/careos/MissionDetailScreen";
export default function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MissionDetailScreen missionId={String(id)} />;
}
