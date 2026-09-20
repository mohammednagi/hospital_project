import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    // Allow ministry admin or hospital admin
    if (role && role !== "MINISTRY_ADMIN" && role !== "HOSPITAL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const governorateId = searchParams.get("governorateId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const where: any = {};
    if (governorateId) {
      where.slot = { clinic: { hospital: { governorateId } } };
    }

    if (startDateParam || endDateParam) {
      where.createdAt = {};
      if (startDateParam) where.createdAt.gte = new Date(startDateParam);
      if (endDateParam) where.createdAt.lte = new Date(endDateParam);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { governorate: true } },
        slot: {
          include: {
            clinic: {
              include: {
                hospital: { include: { governorate: true } },
                specialty: true,
              },
            },
            doctor: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: (session?.user as any)?.id || "MINISTRY_EXPORT",
        action: "DATA_EXPORT_CSV",
        entity: "Appointment",
        entityId: "bulk_export",
        meta: { recordsCount: appointments.length, governorateId },
      },
    });

    // Construct CSV lines with UTF-8 BOM
    const headers = [
      "رقم التذكرة",
      "رقم الدخول",
      "حالة الموعد",
      "طابور الأولوية",
      "مصدر الحجز",
      "المحافظة",
      "المستشفى",
      "التخصص",
      "غرفة العيادة",
      "الطبيب",
      "تاريخ وساعة الكشف",
      "الرقم القومي للمريض",
      "اسم المواطن",
      "هاتف المواطن",
      "تاريخ التسجيل",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = appointments.map((a) => {
      const s = a.slot;
      const c = s.clinic;
      const h = c.hospital;
      const p = a.patient;
      const d = s.doctor?.user;

      return [
        escapeCsv(a.ticketNo),
        escapeCsv(a.queueNo),
        escapeCsv(a.status),
        escapeCsv(a.priorityLane),
        escapeCsv(a.source),
        escapeCsv(h.governorate?.nameAr || ""),
        escapeCsv(h.nameAr),
        escapeCsv(c.specialty?.nameAr || ""),
        escapeCsv(c.roomLabel),
        escapeCsv(d?.fullNameAr || ""),
        escapeCsv(s.startsAt.toISOString()),
        escapeCsv(p.nationalId),
        escapeCsv(p.fullNameAr),
        escapeCsv(p.phone),
        escapeCsv(a.createdAt.toISOString()),
      ].join(",");
    });

    // Prepend UTF-8 BOM \uFEFF
    const csvContent = "\uFEFF" + headers.join(",") + "\r\n" + rows.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="smartgov-appointments-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
