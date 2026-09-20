import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bookSlotAtomic } from "@/server/actions/appointment.actions";
import { computePriorityLane } from "@/lib/smart/priority-lane";
import { BookingSource, PriorityLane } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const appointments = await prisma.appointment.findMany({
      where: { patientId: userId },
      include: {
        slot: {
          include: {
            clinic: {
              include: {
                hospital: true,
                specialty: true,
              },
            },
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { slot: { startsAt: "desc" } },
    });

    return NextResponse.json({ appointments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slotId, source = "WEB" } = body;

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }

    const patientId = (session.user as any).id;

    // Fetch patient profile to compute priority lane
    const patientUser = await prisma.user.findUniqueOrThrow({
      where: { id: patientId },
    });

    const lane: PriorityLane = computePriorityLane({
      birthDate: patientUser.birthDate,
      hasDisability: patientUser.hasDisability,
      isPregnant: patientUser.isPregnant,
    });

    const appointment = await bookSlotAtomic({
      slotId,
      patientId,
      source: source as BookingSource,
      priorityLane: lane,
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    if (err.message === "SLOT_CAPACITY_EXCEEDED") {
      return NextResponse.json(
        { error: "عذراً، هذا الموعد أصبح مكتملاً للتو. يرجى اختيار موعد آخر." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
