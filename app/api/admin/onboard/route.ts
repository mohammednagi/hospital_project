import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { onboardHospitalAction } from "@/server/actions/admin.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const actorId = (session?.user as any)?.id || "SYSTEM_ADMIN";

    const body = await req.json();
    const { governorateId, nameAr, nameEn, type, address, phone, lat, lng } = body;

    if (!governorateId || !nameAr || !nameEn || !address) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const hospital = await onboardHospitalAction({
      governorateId,
      nameAr,
      nameEn,
      type,
      address,
      phone: phone || "02-12345678",
      lat: lat ? parseFloat(lat) : 30.0444,
      lng: lng ? parseFloat(lng) : 31.2357,
      actorId,
    });

    return NextResponse.json({ success: true, hospital });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
