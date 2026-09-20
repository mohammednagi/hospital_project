import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { haversineDistance } from "@/lib/smart/slot-ranking";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialtyCode = searchParams.get("specialtyCode");
    const governorateId = searchParams.get("governorateId");
    const patientGovCode = searchParams.get("patientGovCode");

    // Fetch patient governorate centroid for distance calculation
    let patientCoords = { lat: 30.0444, lng: 31.2357 }; // Default Cairo
    if (patientGovCode) {
      const pGov = await prisma.governorate.findUnique({
        where: { code: patientGovCode },
      });
      if (pGov) {
        patientCoords = { lat: pGov.lat, lng: pGov.lng };
      }
    } else if (governorateId) {
      const g = await prisma.governorate.findUnique({
        where: { id: governorateId },
      });
      if (g) {
        patientCoords = { lat: g.lat, lng: g.lng };
      }
    }

    const where: any = { isActive: true };
    if (governorateId) {
      where.governorateId = governorateId;
    }

    if (specialtyCode) {
      where.clinics = {
        some: {
          specialty: { code: specialtyCode },
          isActive: true,
        },
      };
    }

    const hospitals = await prisma.hospital.findMany({
      where,
      include: {
        governorate: true,
        clinics: {
          where: specialtyCode ? { specialty: { code: specialtyCode } } : undefined,
          include: { specialty: true },
        },
      },
    });

    // Calculate distance and sort by closest
    const withDistance = hospitals.map((h) => {
      const distKm = haversineDistance(patientCoords, { lat: h.lat, lng: h.lng });
      return {
        ...h,
        distanceKm: distKm,
      };
    });

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({ hospitals: withDistance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
