export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SlotCandidate {
  id: string;
  clinicId: string;
  doctorId: string;
  startsAt: Date | string;
  endsAt: Date | string;
  capacity: number;
  bookedCount: number;
  overbookAllowance?: number;
  hospital: {
    id: string;
    nameAr: string;
    nameEn: string;
    lat: number;
    lng: number;
  };
  specialty?: {
    nameAr: string;
    nameEn: string;
  };
}

export interface PatientLocationContext {
  lat?: number;
  lng?: number;
  governorateCentroid?: GeoPoint;
}

export interface RankedSlotResult {
  slot: SlotCandidate;
  score: number;
  distanceKm: number;
  earlinessScore: number;
  loadScore: number;
  reason: string;
}

/**
 * Calculates Haversine distance in kilometers between two geographical coordinates.
 */
export function haversineDistance(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) *
      Math.cos(toRad(p2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Ranks candidate slots using explainable rule-based intelligence:
 * Score = 0.45 * (earliness) + 0.35 * (1 - distanceNormalized) + 0.20 * (1 - clinicLoad)
 * Returns top 5 recommendations with human-readable localized explanation.
 */
export function rankSlots(
  candidates: SlotCandidate[],
  patient: PatientLocationContext,
  options?: {
    now?: Date;
    locale?: "ar" | "en";
    maxResults?: number;
  }
): RankedSlotResult[] {
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const now = options?.now || new Date();
  const locale = options?.locale || "ar";
  const maxResults = options?.maxResults || 5;

  // Fallback to Cairo centroid if no coordinates provided
  const patientLocation: GeoPoint =
    patient.lat !== undefined && patient.lng !== undefined
      ? { lat: patient.lat, lng: patient.lng }
      : patient.governorateCentroid || { lat: 30.0444, lng: 31.2357 };

  const horizonMs = 14 * 24 * 60 * 60 * 1000; // 14-day booking horizon

  const scored: RankedSlotResult[] = candidates.map((slot) => {
    const slotStart =
      typeof slot.startsAt === "string" ? new Date(slot.startsAt) : slot.startsAt;

    // 1. Earliness Score: [0..1], 1 is sooner, 0 is at horizon limit
    const diffMs = Math.max(0, slotStart.getTime() - now.getTime());
    const earliness = Math.max(0, Math.min(1, 1 - diffMs / horizonMs));

    // 2. Distance & Distance Score: [0..1], 1 is closer, 0 is far (> 100 km)
    const hospCoords: GeoPoint = {
      lat: slot.hospital.lat,
      lng: slot.hospital.lng,
    };
    const distKm = haversineDistance(patientLocation, hospCoords);
    const distNorm = Math.min(1.0, distKm / 100);
    const distanceScore = 1 - distNorm;

    // 3. Clinic Load Score: [0..1], 1 is empty, 0 is fully booked
    const overbook = slot.overbookAllowance || 0;
    const maxCapacity = Math.max(1, slot.capacity + overbook);
    const load = Math.min(1.0, slot.bookedCount / maxCapacity);
    const loadScore = 1 - load;

    // Combined Score: 0.45 * earliness + 0.35 * distanceScore + 0.20 * loadScore
    const totalScore = 0.45 * earliness + 0.35 * distanceScore + 0.2 * loadScore;

    // Human-readable reason generation
    let reason = "";
    if (locale === "ar") {
      if (earliness > 0.85 && distKm <= 10) {
        reason = `أقرب موعد متاح، ${distKm} كم من عنوانك`;
      } else if (distKm <= 5) {
        reason = `أقرب مستشفى لموقعك السكني (${distKm} كم)`;
      } else if (earliness > 0.8) {
        reason = "أقرب موعد زمني متاح بالعيادة";
      } else if (loadScore > 0.7) {
        reason = `عيادة منخفضة الازدحام (${distKm} كم)`;
      } else {
        reason = `موعد ملائم ومتاح (${distKm} كم)`;
      }
    } else {
      if (earliness > 0.85 && distKm <= 10) {
        reason = `Earliest available slot, ${distKm} km from your address`;
      } else if (distKm <= 5) {
        reason = `Closest hospital to your location (${distKm} km)`;
      } else if (earliness > 0.8) {
        reason = "Earliest available clinic appointment";
      } else if (loadScore > 0.7) {
        reason = `Low clinic wait pressure (${distKm} km)`;
      } else {
        reason = `Recommended matching slot (${distKm} km)`;
      }
    }

    return {
      slot,
      score: Number(totalScore.toFixed(3)),
      distanceKm: distKm,
      earlinessScore: Number(earliness.toFixed(3)),
      loadScore: Number(loadScore.toFixed(3)),
      reason,
    };
  });

  // Sort descending by total score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}
