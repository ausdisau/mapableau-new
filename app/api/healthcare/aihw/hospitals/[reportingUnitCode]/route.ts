import { NextResponse } from "next/server";
import { getAihwHospitalEvidenceProfile } from "@/lib/healthcare/aihw/service";
import { isAihwMyHospitalsEnabled } from "@/lib/healthcare/aihw/feature-flags";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportingUnitCode: string }> },
) {
  if (!isAihwMyHospitalsEnabled()) {
    return NextResponse.json({ error: "AIHW MyHospitals integration is disabled" }, { status: 404 });
  }
  const { reportingUnitCode } = await context.params;
  try {
    return NextResponse.json(await getAihwHospitalEvidenceProfile(reportingUnitCode));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AIHW MyHospitals request failed" },
      { status: 502 },
    );
  }
}
