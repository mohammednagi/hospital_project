export interface WaitlistEntryData {
  id: string;
  patientId: string;
  clinicId: string;
  preferredDate: Date | string;
  status: "WAITING" | "OFFERED" | "ACCEPTED" | "EXPIRED";
  offeredSlotId?: string | null;
  offerExpiresAt?: Date | string | null;
  createdAt: Date | string;
}

export interface SlotData {
  id: string;
  clinicId: string;
  startsAt: Date | string;
}

export interface PromotionOfferResult {
  hasCandidate: boolean;
  selectedEntry?: WaitlistEntryData;
  offerExpiresAt?: Date;
  reason?: string;
}

/**
 * Pure function to check if a waitlist offer has expired.
 * Default offer lifetime is 2 hours.
 */
export function isOfferExpired(
  offerExpiresAt: Date | string | null | undefined,
  currentTime: Date = new Date()
): boolean {
  if (!offerExpiresAt) return true;
  const expiry =
    typeof offerExpiresAt === "string" ? new Date(offerExpiresAt) : offerExpiresAt;
  return currentTime.getTime() >= expiry.getTime();
}

/**
 * Pure algorithm to select the oldest WAITING entry for a freed slot.
 * Enforces FIFO fairness: entries ordered by createdAt ASC.
 *
 * @param waitingEntries List of candidate entries for the clinic
 * @param slot Freed slot details
 * @param currentTime Mockable current timestamp
 * @param offerDurationHours Expiration window (defaults to 2 hours)
 */
export function selectWaitlistPromotionCandidate(
  waitingEntries: WaitlistEntryData[],
  slot: SlotData,
  currentTime: Date = new Date(),
  offerDurationHours = 2
): PromotionOfferResult {
  if (!waitingEntries || waitingEntries.length === 0) {
    return {
      hasCandidate: false,
      reason: "No patients waiting in queue for this clinic",
    };
  }

  // Filter for WAITING status or EXPIRED offers that can be re-evaluated
  const eligible = waitingEntries
    .filter((e) => e.clinicId === slot.clinicId && e.status === "WAITING")
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

  if (eligible.length === 0) {
    return {
      hasCandidate: false,
      reason: "No eligible WAITING entries found for clinic",
    };
  }

  const oldest = eligible[0];
  const offerExpiresAt = new Date(
    currentTime.getTime() + offerDurationHours * 60 * 60 * 1000
  );

  return {
    hasCandidate: true,
    selectedEntry: oldest,
    offerExpiresAt,
    reason: `Offered to patient ${oldest.patientId} (Expires in ${offerDurationHours} hours)`,
  };
}

/**
 * Updates waitlist entry status on promotion offer.
 */
export function createWaitlistOffer(
  entry: WaitlistEntryData,
  slotId: string,
  currentTime: Date = new Date(),
  offerDurationHours = 2
): WaitlistEntryData {
  const offerExpiresAt = new Date(
    currentTime.getTime() + offerDurationHours * 60 * 60 * 1000
  );

  return {
    ...entry,
    status: "OFFERED",
    offeredSlotId: slotId,
    offerExpiresAt,
  };
}
