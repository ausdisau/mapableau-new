import type { Metadata } from "next";
import { TourismItinerary } from "@/components/tourism/TourismExperience";
export const metadata: Metadata = { title: "Your Sydney itinerary | MapAble Tourism" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const {id}=await params; if(id!=="sydney-demo") return <main className="p-12"><h1>Trip not found</h1><a href="/tourism/plan">Create a trip</a></main>; return <TourismItinerary />; }
