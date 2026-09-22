import { describe, expect, it } from 'vitest';

import {
  cueForBoundary,
  nextBoundaryAfter,
  shouldPlayPlannedCue,
  type Cue,
} from '../src/timer';

const QUARTER_MS = 15_000;
const MINUTE_MS = 60_000;
const LATE_CUE_LIMIT_MS = 250;

/** Deterministic pseudo-random generator: reproducible property tests. */
function randomIntegers(seed: number, count: number): number[] {
  let state = seed >>> 0;
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    values.push(state);
  }

  return values;
}

function expectedNextBoundary(nowMs: number): number {
  return (Math.floor(nowMs / QUARTER_MS) + 1) * QUARTER_MS;
}

describe('invariants derived from docs/spec.md', () => {
  it('always schedules the next cue at a strictly future 15-second system-clock boundary', () => {
    const randomTimes = randomIntegers(0x1badb002, 2_000).map(
      (value) => value * 1_000 + (value % 1_000),
    );
    const edgeCases = [
      0,
      1,
      QUARTER_MS - 1,
      QUARTER_MS,
      QUARTER_MS + 1,
      MINUTE_MS - 1,
      MINUTE_MS,
      MINUTE_MS + 1,
      86_399_999,
      86_400_000,
      1_735_689_599_999,
    ];

    for (const nowMs of [...randomTimes, ...edgeCases]) {
      const boundaryMs = nextBoundaryAfter(nowMs);

      expect(boundaryMs).toBe(expectedNextBoundary(nowMs));
      expect(boundaryMs).toBeGreaterThan(nowMs);
      expect(boundaryMs % QUARTER_MS).toBe(0);
      expect(boundaryMs - nowMs).toBeLessThanOrEqual(QUARTER_MS);
    }
  });

  it('always maps every system-clock quarter boundary to the specified cue pattern', () => {
    const randomBoundaries = randomIntegers(0xc0ffee, 2_000).map(
      (value) => value * QUARTER_MS,
    );
    const edgeCases = [
      0,
      QUARTER_MS,
      2 * QUARTER_MS,
      3 * QUARTER_MS,
      MINUTE_MS,
      24 * 60 * MINUTE_MS,
      365 * 24 * 60 * MINUTE_MS,
    ];

    for (const boundaryMs of [...randomBoundaries, ...edgeCases]) {
      const quarterWithinMinute = (boundaryMs % MINUTE_MS) / QUARTER_MS;
      const cue: Cue = cueForBoundary(boundaryMs);

      if (quarterWithinMinute === 0) {
        expect(cue).toEqual({ kind: 'boundary', shortBeepCount: 0 });
      } else {
        expect(cue).toEqual({
          kind: 'quarter',
          shortBeepCount: quarterWithinMinute,
        });
      }
    }
  });

  it('always permits only a cue delivered on its boundary or within 250 ms afterwards', () => {
    const randomBoundaries = randomIntegers(0xdecafbad, 2_000).map(
      (value) => value * QUARTER_MS,
    );
    const deliveryOffsets = randomIntegers(0x51a1a1, 2_000).map(
      (value) => (value % 2_001) - 500,
    );
    const edgeOffsets = [-1, 0, 1, LATE_CUE_LIMIT_MS - 1, LATE_CUE_LIMIT_MS, LATE_CUE_LIMIT_MS + 1];

    for (let index = 0; index < randomBoundaries.length; index += 1) {
      const plannedBoundaryMs = randomBoundaries[index];
      const deliveredAtMs = plannedBoundaryMs + deliveryOffsets[index];

      expect(shouldPlayPlannedCue(plannedBoundaryMs, deliveredAtMs)).toBe(
        deliveredAtMs >= plannedBoundaryMs && deliveredAtMs - plannedBoundaryMs <= LATE_CUE_LIMIT_MS,
      );
    }

    for (const offsetMs of edgeOffsets) {
      expect(shouldPlayPlannedCue(MINUTE_MS, MINUTE_MS + offsetMs)).toBe(
        offsetMs >= 0 && offsetMs <= LATE_CUE_LIMIT_MS,
      );
    }
  });
});
