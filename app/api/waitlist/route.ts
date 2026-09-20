import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WaitlistStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clinicId, preferredDate } = body;

    if (!clinicId) {
      return NextResponse.json({ error: "clinicId is required" }, { status: 400 });
    }

    const patientId = (session.user as any).id;
    const prefDate = preferredDate ? new Date(preferredDate) : new Date();

    const waitlist = await prisma.waitlistEntry.create({
      data: {
        patientId,
        clinicId,
        preferredDate: prefDate,
        status: WaitlistStatus.WAITING,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: patientId,
        action: "WAITLIST_JOINED",
        entity: "WaitlistEntry",
        entityId: waitlist.id,
        meta: { clinicId, preferredDate: prefDate.toISOString() },
      },
    });

    return NextResponse.json({ success: true, waitlist });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
