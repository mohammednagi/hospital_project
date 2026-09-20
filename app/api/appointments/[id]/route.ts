import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelAppointment, rescheduleAppointment } from "@/server/actions/appointment.actions";
import { generateQrDataUrl } from "@/lib/qr";
import { generateICSContent } from "@/lib/calendar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
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
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Generate QR Code data URL encoding verification payload
    const qrPayload = JSON.stringify({
      aid: appointment.id,
      tkt: appointment.ticketNo,
      q: appointment.queueNo,
      pid: appointment.patient.nationalId,
      startsAt: appointment.slot.startsAt.toISOString(),
    });
    const qrDataUrl = await generateQrDataUrl(qrPayload);

    // Generate RFC 5545 .ics Calendar Content
    const icsContent = generateICSContent({
      title: `كشف عيادة ${appointment.slot.clinic.specialty.nameAr} - ${appointment.slot.clinic.hospital.nameAr}`,
      description: `تذكرة رقم: ${appointment.ticketNo}\nرقم الدخول: ${appointment.queueNo}\nالمريض: ${appointment.patient.fullNameAr}\nالغرفة: ${appointment.slot.clinic.roomLabel}`,
      location: `${appointment.slot.clinic.hospital.nameAr}, ${appointment.slot.clinic.hospital.address}`,
      startsAt: appointment.slot.startsAt,
      endsAt: appointment.slot.endsAt,
    });

    return NextResponse.json({
      appointment,
      qrDataUrl,
      icsContent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newSlotId } = body;

    if (!newSlotId) {
      return NextResponse.json({ error: "newSlotId is required" }, { status: 400 });
    }

    const actorId = (session.user as any).id;
    const updated = await rescheduleAppointment({
      appointmentId: id,
      newSlotId,
      actorId,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const actorId = (session.user as any).id;

    const cancelled = await cancelAppointment({
      appointmentId: id,
      actorId,
    });

    return NextResponse.json({ success: true, appointment: cancelled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
