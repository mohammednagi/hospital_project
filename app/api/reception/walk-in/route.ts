import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receptionWalkInBookingAction } from "@/server/actions/reception.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const actorId = (session?.user as any)?.id || "SYSTEM_RECEPTION";

    const body = await req.json();
    const {
      clinicId,
      nationalId,
      fullNameAr,
      fullNameEn,
      phone,
      hasDisability,
      isPregnant,
    } = body;

    if (!clinicId || !nationalId || !fullNameAr || !phone) {
      return NextResponse.json(
        { error: "clinicId, nationalId, fullNameAr, and phone are required" },
        { status: 400 }
      );
    }

    const appointment = await receptionWalkInBookingAction({
      clinicId,
      nationalId,
      fullNameAr,
      fullNameEn: fullNameEn || fullNameAr,
      phone,
      hasDisability: !!hasDisability,
      isPregnant: !!isPregnant,
      actorId,
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
