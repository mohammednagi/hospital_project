import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createBlackoutDayAction } from "@/server/actions/admin.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const actorId = (session?.user as any)?.id || "SYSTEM_ADMIN";

    const body = await req.json();
    const { hospitalId, doctorId, date, reason } = body;

    if (!date || !reason) {
      return NextResponse.json({ error: "Date and reason are required" }, { status: 400 });
    }

    const blackout = await createBlackoutDayAction({
      hospitalId,
      doctorId,
      date,
      reason,
      actorId,
    });

    return NextResponse.json({ success: true, blackout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
