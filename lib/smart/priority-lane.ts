export type PriorityLane = "NONE" | "ELDERLY" | "DISABILITY" | "PREGNANCY";

export interface UserPriorityProfile {
  birthDate: Date | string;
  hasDisability?: boolean | null;
  isPregnant?: boolean | null;
}

/**
 * Calculates user age in full years from birth date.
 */
export function calculateAge(birthDate: Date | string, referenceDate: Date = new Date()): number {
  const bd = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  let age = referenceDate.getFullYear() - bd.getFullYear();
  const monthDiff = referenceDate.getMonth() - bd.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < bd.getDate())) {
    age--;
  }

  return age;
}

/**
 * Computes priority lane based on citizen demographic indicators:
 * - DISABILITY if user.hasDisability === true
 * - PREGNANCY if user.isPregnant === true
 * - ELDERLY if age >= 60
 * - else NONE
 *
 * Priority lanes get priority ordering in clinic queues.
 */
export function computePriorityLane(
  user: UserPriorityProfile,
  referenceDate: Date = new Date()
): PriorityLane {
  if (user.hasDisability) {
    return "DISABILITY";
  }

  if (user.isPregnant) {
    return "PREGNANCY";
  }

  const age = calculateAge(user.birthDate, referenceDate);
  if (age >= 60) {
    return "ELDERLY";
  }

  return "NONE";
}

/**
 * Priority rank helper for queue sorting.
 * Higher rank = served earlier.
 */
export function getPriorityLaneRank(lane: PriorityLane): number {
  switch (lane) {
    case "DISABILITY":
      return 3;
    case "PREGNANCY":
      return 2;
    case "ELDERLY":
      return 1;
    case "NONE":
    default:
      return 0;
  }
}
