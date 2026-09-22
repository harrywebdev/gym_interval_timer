# Test contract derived from `docs/spec.md`

These tests deliberately import `src/timer.ts`, which does not exist yet.  They
define the small pure scheduling seam that the future UI/audio implementation
must expose:

```ts
export type Cue =
  | { kind: 'boundary'; shortBeepCount: 0 }
  | { kind: 'quarter'; shortBeepCount: 1 | 2 | 3 };

export function nextBoundaryAfter(nowMs: number): number;
export function cueForBoundary(boundaryMs: number): Cue;
export function shouldPlayPlannedCue(
  plannedBoundaryMs: number,
  deliveredAtMs: number,
): boolean;
```

`nextBoundaryAfter` receives a local system-clock Unix timestamp and returns a
Unix timestamp.  The rules being tested are product rules, rather than a
particular implementation: boundaries are strictly future multiples of 15
seconds; cue patterns come from the seconds value; and a cue is accepted only
when delivered from its boundary through 250 ms afterwards.
