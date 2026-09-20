import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receptionCheckInAction } from "@/server/actions/reception.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const actorId = (session?.user as any)?.id || "SYSTEM_RECEPTION";

    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Ticket number or National ID is required" },
        { status: 400 }
      );
    }

    const updated = await receptionCheckInAction(query, actorId);
    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
