/** Duration of one cue interval: :00, :15, :30, and :45. */
const QUARTER_MINUTE_MS = 15_000;

/** The maximum callback delay for which a planned cue remains current. */
const LATE_CUE_LIMIT_MS = 250;

/**
 * A cue at the top of a minute is deliberately distinct from the short-beep
 * patterns used at the other quarter-minute boundaries.
 */
export type Cue =
  | { kind: 'boundary'; shortBeepCount: 0 }
  | { kind: 'quarter'; shortBeepCount: 1 | 2 | 3 };

/**
 * Returns the first quarter-minute boundary that is strictly later than now.
 *
 * The computation uses the current clock timestamp directly, so callers can
 * recalculate after delayed callbacks or system-clock changes without drift.
 */
export function nextBoundaryAfter(nowMs: number): number {
  return (Math.floor(nowMs / QUARTER_MINUTE_MS) + 1) * QUARTER_MINUTE_MS;
}

/** Returns the prescribed audio pattern for a quarter-minute boundary. */
export function cueForBoundary(boundaryMs: number): Cue {
  const quarterIndex = Math.floor(boundaryMs / QUARTER_MINUTE_MS);
  const quarterWithinMinute = ((quarterIndex % 4) + 4) % 4;

  if (quarterWithinMinute === 0) {
    return { kind: 'boundary', shortBeepCount: 0 };
  }

  return {
    kind: 'quarter',
    shortBeepCount: quarterWithinMinute as 1 | 2 | 3,
  };
}

/**
 * A wake-up is eligible only on the planned boundary or during the allowed
 * 250 ms grace period; early and stale callbacks must not start a pattern.
 */
export function shouldPlayPlannedCue(
  plannedBoundaryMs: number,
  deliveredAtMs: number,
): boolean {
  const delayMs = deliveredAtMs - plannedBoundaryMs;
  return delayMs >= 0 && delayMs <= LATE_CUE_LIMIT_MS;
}
