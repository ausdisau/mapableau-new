import type { Metadata } from "next";
import { TourismPlanner } from "@/components/tourism/TourismExperience";
export const metadata: Metadata = { title: "Plan Sydney | MapAble Tourism" };
export default function Page() { return <TourismPlanner />; }
