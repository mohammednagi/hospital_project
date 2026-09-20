import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankSlots, type SlotCandidate } from "@/lib/smart/slot-ranking";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId");
    const specialtyCode = searchParams.get("specialtyCode");
    const clinicId = searchParams.get("clinicId");
    const locale = (searchParams.get("locale") as "ar" | "en") || "ar";
    const patientLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
    const patientLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;

    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const whereClinic: any = { isActive: true };
    if (hospitalId) whereClinic.hospitalId = hospitalId;
    if (specialtyCode) whereClinic.specialty = { code: specialtyCode };
    if (clinicId) whereClinic.id = clinicId;

    const slots = await prisma.slot.findMany({
      where: {
        startsAt: {
          gte: now,
          lte: horizon,
        },
        clinic: whereClinic,
      },
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
      orderBy: { startsAt: "asc" },
      take: 60,
    });

    // Map to SlotCandidate format
    const candidates: SlotCandidate[] = slots.map((s) => ({
      id: s.id,
      clinicId: s.clinicId,
      doctorId: s.doctorId,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      capacity: s.capacity,
      bookedCount: s.bookedCount,
      overbookAllowance: s.overbookAllowance,
      hospital: {
        id: s.clinic.hospital.id,
        nameAr: s.clinic.hospital.nameAr,
        nameEn: s.clinic.hospital.nameEn,
        lat: s.clinic.hospital.lat,
        lng: s.clinic.hospital.lng,
      },
      specialty: {
        nameAr: s.clinic.specialty.nameAr,
        nameEn: s.clinic.specialty.nameEn,
      },
    }));

    // Filter available (bookedCount < capacity + overbookAllowance)
    const available = candidates.filter(
      (c) => c.bookedCount < c.capacity + (c.overbookAllowance || 0)
    );

    // Rank top 5 smart recommendations
    const patientLocation = { lat: patientLat, lng: patientLng };
    const rankedTop5 = rankSlots(available, patientLocation, {
      now,
      locale,
      maxResults: 5,
    });

    return NextResponse.json({
      recommended: rankedTop5,
      allAvailable: available,
      totalFound: available.length,
      hasSlotsUnder7Days: available.some((s) => {
        const slotDate = new Date(s.startsAt);
        const diffDays = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
