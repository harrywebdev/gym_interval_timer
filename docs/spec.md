# PRD — Gym Interval Audio Timer

## 1. Product overview

A minimal, mobile-first web application for gym workouts. The user starts a continuously running timer and can exercise without looking at the phone. Audible signals communicate each 15-second boundary within a repeating 60-second cycle.

Primary target: **iPhone / iOS Safari**.

The application should be extremely small, reliable, and usable offline.

## 2. Core use case

The user opens the app before exercising, presses **Start**, leaves the iPhone unlocked with the page open, and relies on audio cues rather than watching the screen.

A repeating 60-second cycle produces:

- `00s / 60s` — one distinct, slightly longer and higher-pitched tone
- `15s` — 1 short beep
- `30s` — 2 short beeps
- `45s` — 3 short beeps
- `60s` — distinct longer/higher tone, then the cycle repeats

The timer runs indefinitely until explicitly stopped.

## 3. Controls

### Start / Pause

One button changes state depending on the timer state:

- **Start** when stopped
- **Pause** while running
- **Resume** after pausing

Starting from zero immediately plays the 60-second/boundary tone because time zero represents the boundary between cycles.

Resuming from Pause must **not** replay the start/boundary tone. It continues from the exact paused elapsed time.

### Stop / Reset

A separate Stop/Reset control:

- stops timing
- stops/suppresses pending audio
- resets elapsed time to `00:00`
- returns the timer to its initial state

## 4. Display

Keep the UI deliberately minimal.

Required elements:

- prominent elapsed-time display
- Start/Pause/Resume button
- Stop/Reset button

The application is primarily audio-driven. It must not require visual attention during exercise.

Design mobile-first for iPhone Safari.

## 5. Timing requirements

Timing correctness is a critical requirement.

Do **not** implement timing by assuming that `setInterval(..., 1000)` or similar callbacks execute exactly on schedule. JavaScript event-loop delays must not accumulate into timer drift.

Use a monotonic/high-resolution clock such as `performance.now()` as the authoritative elapsed-time source while the page is active.

The implementation should derive:

- current elapsed time
- current position within the 60-second cycle
- next audio boundary

from timestamps rather than from a counter incremented by timer callbacks.

`setTimeout` or similar scheduling primitives may be used to wake the application near a boundary, but they must not themselves be the source of truth.

If a callback fires late, subsequent boundaries must remain aligned with the original timeline rather than shifting by the delay.

Pause/resume must preserve elapsed time accurately.

## 6. Audio

Generate tones programmatically using the native **Web Audio API**. Do not depend on MP3/WAV assets.

Suggested initial parameters:

### Quarter-minute beep

- duration: approximately `300 ms`
- same pitch for the 15s, 30s and 45s signals

Patterns:

- 15 seconds: 1 beep
- 30 seconds: 2 beeps
- 45 seconds: 3 beeps

Choose a short, clearly perceptible gap between multiple beeps.

### Full-minute / cycle-boundary tone

- duration: approximately `500 ms`
- noticeably higher pitch than the short beep
- played once

It is played:

- immediately when starting a fresh timer at `00:00`
- every 60 seconds thereafter

The exact frequencies and beep spacing can be chosen during implementation for good audibility without being unpleasant.

The AudioContext should be initialized/resumed from the user's Start interaction so the implementation works with iOS Safari's user-gesture audio restrictions.

## 7. Background behavior

Primary supported mode is:

> Safari open, page in the foreground, iPhone unlocked.

Do not promise reliable audio while iOS has suspended Safari, the device is locked, or the page is backgrounded.

When execution is temporarily delayed and later resumes, elapsed time must be recalculated from timestamps rather than accumulating callback delay.

The application should avoid producing a burst of all historical missed beeps after returning from a long suspension.

## 8. Technology stack

Keep the application deliberately small.

Required:

- Vite
- TypeScript
- native browser APIs
- HTML/CSS

Not required and preferably avoided:

- React
- Next.js
- backend/server application
- database
- authentication

This is a static client-side application.

## 9. Offline support and Service Worker

The application must work offline after it has been successfully loaded once.

Use a Service Worker to cache the application shell and required static assets.

A lightweight Vite-compatible Service Worker solution such as `vite-plugin-pwa` may be used if appropriate.

Requirements:

- all functionality required for the timer works offline
- deploys have an explicit cache/version update strategy
- obsolete caches/assets are removed
- a newly deployed version must eventually replace the cached previous version
- users should not remain permanently pinned to stale assets
- an update must not unexpectedly interrupt an active workout

Document the chosen Service Worker lifecycle/update strategy.

Full installable-PWA behavior is **not** a requirement. The user may simply add a shortcut/icon to the iPhone Home Screen that opens the site in Safari.

## 10. Deployment

The application will be hosted using **Disco / disco.cloud** in the user's personal cloud environment.

Include a root-level:

`disco.json`

It must contain the deployment configuration required for this Vite static application.

Do not invent undocumented Disco configuration fields. Verify the current Disco configuration format before implementing `disco.json`.

The production build must be deployable from the repository using the documented Disco workflow.

## 11. Repository documentation

Documentation is part of the deliverable.

Expected structure:

```text
/
├── README.md
├── disco.json
├── package.json
├── ...
└── docs/
    ├── PRD.md
    └── ...
```

### README.md

Explain at minimum:

- what the application does
- prerequisites
- local development
- production build
- deployment through Disco
- offline behavior
- browser/platform assumptions
- basic architecture

### docs/PRD.md

Store this product requirements document in the repository as `docs/PRD.md`.

Additional architectural or implementation documentation may be added to `docs/` when useful.

## 12. Quality expectations

Prioritize:

1. accurate timing
2. reliable audible cues
3. correct iOS Safari behavior
4. offline reliability
5. minimal implementation complexity
6. maintainability

Avoid unnecessary dependencies and abstraction.

## 13. Acceptance criteria

The implementation is complete when:

- pressing Start from zero immediately plays the cycle-boundary tone
- the elapsed-time display starts running
- 15 seconds produces one short beep
- 30 seconds produces two short beeps
- 45 seconds produces three short beeps
- 60 seconds produces the distinct longer/higher tone
- the sequence repeats every minute indefinitely
- Pause freezes elapsed workout time
- Resume continues from the paused position without replaying the initial tone
- Stop resets the timer to zero
- normal JavaScript scheduling delays do not create cumulative timer drift
- the timer works on current iOS Safari while the page remains active
- the application works without connectivity after being cached
- a new deployment has a defined mechanism for replacing obsolete cached assets
- the repository contains useful README documentation
- `docs/PRD.md` exists
- `disco.json` exists and documents/supports deployment to Disco
- no backend is required
