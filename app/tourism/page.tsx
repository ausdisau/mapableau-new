import type { Metadata } from "next";
import { TourismDiscover } from "@/components/tourism/TourismExperience";
export const metadata: Metadata = { title: "MapAble Tourism | Discover Sydney" };
export default function Page() { return <TourismDiscover />; }
