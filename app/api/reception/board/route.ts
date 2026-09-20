import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get("clinicId");
    const hospitalId = searchParams.get("hospitalId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClinic: any = {};
    if (clinicId) whereClinic.id = clinicId;
    if (hospitalId) whereClinic.hospitalId = hospitalId;

    const appointments = await prisma.appointment.findMany({
      where: {
        slot: {
          startsAt: {
            gte: today,
            lt: tomorrow,
          },
          clinic: whereClinic,
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
      orderBy: { queueNo: "asc" },
    });

    const booked = appointments.filter(
      (a) => a.status === AppointmentStatus.BOOKED || a.status === AppointmentStatus.CONFIRMED
    );
    const checkedIn = appointments.filter(
      (a) => a.status === AppointmentStatus.CHECKED_IN
    );
    const inProgress = appointments.filter(
      (a) => a.status === AppointmentStatus.IN_PROGRESS
    );
    const completedOrNoShow = appointments.filter(
      (a) => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.NO_SHOW
    );

    return NextResponse.json({
      board: {
        booked,
        checkedIn,
        inProgress,
        completedOrNoShow,
      },
      totalToday: appointments.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
