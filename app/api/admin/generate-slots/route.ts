import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSlotsAction } from "@/server/actions/admin.actions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const actorId = (session?.user as any)?.id || "SYSTEM_ADMIN";

    const body = await req.json();
    const { hospitalId, days = 14 } = body;

    if (!hospitalId) {
      return NextResponse.json({ error: "hospitalId is required" }, { status: 400 });
    }

    const result = await generateSlotsAction({
      hospitalId,
      days,
      actorId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
