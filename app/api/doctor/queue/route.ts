import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPriorityLaneRank } from "@/lib/smart/priority-lane";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let clinicId = searchParams.get("clinicId");

    // If no clinicId passed, get the first active clinic
    if (!clinicId) {
      const firstClinic = await prisma.clinic.findFirst({
        where: { isActive: true },
      });
      if (firstClinic) clinicId = firstClinic.id;
    }

    if (!clinicId) {
      return NextResponse.json({ queue: [], active: null });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        slot: {
          clinicId,
          startsAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      include: {
        patient: true,
        slot: {
          include: {
            clinic: {
              include: { specialty: true, hospital: true },
            },
            doctor: { include: { user: true } },
          },
        },
      },
    });

    // Currently active consultation
    const active = appointments.find((a) => a.status === "IN_PROGRESS") || null;

    // Waiting queue: CHECKED_IN patients sorted by priority lane first, then queueNo
    const waitingQueue = appointments
      .filter((a) => a.status === "CHECKED_IN")
      .sort((a, b) => {
        const rankDiff =
          getPriorityLaneRank(b.priorityLane as any) -
          getPriorityLaneRank(a.priorityLane as any);
        if (rankDiff !== 0) return rankDiff;
        return a.queueNo - b.queueNo;
      });

    // Completed or No-Show history today
    const history = appointments.filter((a) =>
      ["COMPLETED", "NO_SHOW"].includes(a.status)
    );

    return NextResponse.json({
      active,
      queue: waitingQueue,
      history,
      totalCount: appointments.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
