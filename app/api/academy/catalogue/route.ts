import { NextResponse } from "next/server";

import { listPublishedCatalogue } from "@/lib/academy/catalogue/catalogue-service";

export async function GET() {
  const catalogue = await listPublishedCatalogue();
  return NextResponse.json({ catalogue });
}
