import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { doctorMarkNoShowAction } from "@/server/actions/doctor.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const doctorUserId = (session?.user as any)?.id || "SYSTEM_DOCTOR";

    const body = await req.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId is required" },
        { status: 400 }
      );
    }

    const updated = await doctorMarkNoShowAction(appointmentId, doctorUserId);
    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
