import { NextResponse } from "next/server";
import { listAihwHospitals } from "@/lib/healthcare/aihw/client";
import { isAihwMyHospitalsEnabled } from "@/lib/healthcare/aihw/feature-flags";

export async function GET() {
  if (!isAihwMyHospitalsEnabled()) {
    return NextResponse.json({ error: "AIHW MyHospitals integration is disabled" }, { status: 404 });
  }
  const response = await listAihwHospitals();
  return NextResponse.json({
    hospitals: response.result,
    versionInformation: response.version_information,
    source: "Australian Institute of Health and Welfare - MyHospitals API v1",
  });
}
