import { NextResponse } from "next/server";

import { fetchProviderDirectory } from "@/lib/provider-directory/fetch-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { providers, meta } = await fetchProviderDirectory();
    return NextResponse.json({ data: providers, meta });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load provider directory",
      },
      { status: 500 },
    );
  }
}
