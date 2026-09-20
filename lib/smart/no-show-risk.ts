export interface PatientHistoryContext {
  totalAppointments: number;
  pastNoShows: number;
  leadTimeDays: number; // Days between booking time and appointment slot
  isMorningFirstSlot?: boolean; // Slot starts at opening hour (e.g. 09:00)
  distanceKm?: number; // Haversine distance to hospital
  isFirstTimePatient?: boolean;
}

/**
 * Pure heuristic calculator for predicting patient no-show risk (0.0 to 1.0).
 *
 * Formula:
 * - Past no-show ratio * 0.5
 * - Lead time > 7 days: +0.15
 * - Morning first slot: +0.05
 * - Distance > 25 km: +0.10
 * - First-time patient (never attended before): +0.20
 *
 * Result is clamped strictly between 0.0 and 1.0.
 */
export function noShowRisk(context: PatientHistoryContext): number {
  let risk = 0;

  // 1. Past no-show ratio (weight 0.5)
  if (context.totalAppointments > 0) {
    const ratio = Math.min(1.0, context.pastNoShows / context.totalAppointments);
    risk += ratio * 0.5;
  }

  // 2. Lead time > 7 days (+0.15)
  if (context.leadTimeDays > 7) {
    risk += 0.15;
  }

  // 3. Morning first slot (+0.05)
  if (context.isMorningFirstSlot) {
    risk += 0.05;
  }

  // 4. Distance > 25 km (+0.10)
  if (context.distanceKm !== undefined && context.distanceKm > 25) {
    risk += 0.1;
  }

  // 5. Never attended before (+0.20)
  const isFirstTime =
    context.isFirstTimePatient ?? (context.totalAppointments === 0);
  if (isFirstTime) {
    risk += 0.2;
  }

  // Clamp strictly between 0.0 and 1.0
  const clamped = Math.max(0.0, Math.min(1.0, risk));
  return Number(clamped.toFixed(3));
}

/**
 * Computes slot overbooking allowance based on capacity and average no-show risk.
 * Formula: floor(capacity * avgRisk), capped at maximum 2.
 */
export function calculateOverbookAllowance(
  capacity: number,
  avgRisk: number
): number {
  if (capacity <= 0 || avgRisk <= 0) return 0;
  const raw = Math.floor(capacity * avgRisk);
  return Math.max(0, Math.min(2, raw));
}
