# PRD — Gym Interval Audio Timer

## 1. Product overview

Minimal mobile-first web application for gym workouts. The app displays the current local system time and, when enabled, plays audible signals on its quarter-minute boundaries. The user can exercise without watching the phone.

Primary target: **iPhone / iOS Safari**.

The application should be very small, reliable, and usable offline after a successful initial load.

## 2. Core use case

The user opens the app, presses **Start**, leaves the iPhone unlocked with the page open, and relies on audio cues rather than the display.

The cue schedule is aligned to the device's current local system clock, not to the instant the user pressed Start:

- at `HH:MM:00` — one distinct, slightly longer and higher-pitched tone
- at `HH:MM:15` — 1 short beep
- at `HH:MM:30` — 2 short beeps
- at `HH:MM:45` — 3 short beeps

For example, starting at `14:37:06` makes the first cue occur at `14:37:15`. Starting exactly on a boundary waits for the following boundary; it does not play that boundary's cue retrospectively.

## 3. Controls and state

There is one primary button:

- **Start** enables cue scheduling and changes the button label to **Stop**.
- **Stop** disables future cues and changes the label back to **Start**.

Start never plays an immediate cue; the next cue is always the next strictly future system-clock boundary. Stop may allow a tone or a multi-beep pattern that has already started to finish, but must not start a new pattern.

The enabled/disabled state is persisted locally. A reload or later reopening of the app should restore the enabled state where possible. Stop clears that stored state.

## 4. Display and interaction

Show the current local system time prominently in 24-hour format including seconds, for example `14:37:15`.

The display always represents the current system time; it does not show an elapsed workout duration and has no Pause/Resume control.

Keep the UI deliberately minimal and mobile-first for iPhone Safari. Include an unobtrusive sound-problem icon in the upper-right corner only when audio cannot be activated or resumed. Tapping it retries audio activation from a user gesture; a successful retry may play a short confirmation tone, while regular cue scheduling waits for the next natural boundary.

## 5. Timing requirements

The device's current system time is the source of truth for both the display and cue phase. The app must calculate the next *strictly future* quarter-minute boundary from the current timestamp; timer callbacks are only wake-up hints, not an accumulated counter.

Normal JavaScript scheduling delays must not shift later boundaries. A cue whose callback arrives no more than 250 ms after its planned boundary should still play; an older missed cue must be skipped, and scheduling resumes at the next future boundary. In every case, later boundaries remain aligned to system time rather than accumulating callback delay.

A manual device-clock, time-zone, or system-clock synchronization change is accepted: the display and cue schedule immediately realign to the new system time. Do not deduplicate cues across such a change; if the clock is moved back, the next occurrence of a boundary is eligible to play again.

When the page was suspended, backgrounded, or blocked, do not replay missed cues on return; wait for the next future boundary. Reliable audio is only supported while Safari remains foregrounded and the iPhone is unlocked.

Where supported, request a screen wake lock while enabled and release it when stopped; lack of wake-lock support must not prevent use of the timer.

## 6. Audio

Generate all tones with the native Web Audio API; do not depend on MP3 or WAV assets.

Suggested starting parameters:

- short beep: about 300 ms, same pitch for `:15`, `:30`, and `:45`
- boundary tone: about 500 ms and noticeably higher pitched for `:00`
- multiple short beeps: a short, clearly perceptible gap between beeps

Initialize or resume the AudioContext from the Start interaction. iOS may block sound after a reload until another user gesture: retain the enabled UI state, show the sound-problem icon, and let tapping the icon retry activation. A successful retry may play a short confirmation tone.

## 7. Offline support and Service Worker

The application must work without connectivity after it has successfully loaded once. Cache the application shell and required static assets with a Service Worker using a lightweight Vite-compatible approach.

Use versioned assets and remove obsolete caches. A new deployment may download in the background, but it must activate only on the user's next explicit reload or reopening of the page so it does not interrupt an active workout.

Offline operation cannot be guaranteed for a first visit before assets have been cached.

## 8. Technology stack

Keep the application deliberately small.

Required:

- Vite
- TypeScript
- native browser APIs
- HTML/CSS

Prefer to avoid React, Next.js, a backend/server application, a database, and authentication. This is a static client-side application.

## 9. Deployment

The application will be hosted through Disco / disco.cloud in the user's personal cloud environment.

Include a root-level `disco.json` containing the deployment configuration required for this Vite static application. Verify the current documented Disco configuration format before implementing it; do not invent undocumented fields.

The production build must be deployable from the repository using the documented Disco workflow.

## 10. Repository documentation

Expected structure:

```text
/
├── README.md
├── disco.json
├── package.json
├── ...
└── docs/
    ├── spec.md
    └── ...
```

### README.md

Explain at minimum:

- what the application does
- prerequisites
- local development
- production build
- deployment through Disco
- offline behavior and update lifecycle
- browser/platform assumptions
- basic architecture

### docs/spec.md

This file is the product requirements document. Additional architectural or implementation documentation may be added to `docs/` when useful.

## 11. Quality expectations

Prioritize:

1. correct system-clock cue alignment
2. reliable audible cues on active iOS Safari
3. correct recovery from browser audio restrictions
4. offline reliability and non-disruptive updates
5. minimal implementation complexity
6. maintainability

## 12. Acceptance criteria

The implementation is complete when:

- the display shows the current local time in 24-hour `HH:MM:SS` format
- Start causes the next signal to occur only at the next strictly future quarter-minute system-clock boundary
- `:15` produces one short beep
- `:30` produces two short beeps
- `:45` produces three short beeps
- `:00` produces the distinct longer/higher tone
- Stop prevents new signals and returns the primary control to Start
- Stop may let an already-started signal pattern finish
- a cue up to 250 ms late may still play, while older missed cues are skipped
- normal JavaScript scheduling delays do not create cumulative boundary drift
- a system-clock change immediately realigns display and future cues
- missed cues are not replayed after page suspension; the next future boundary is used instead
- enabled state is retained across reload where possible, and Stop clears it
- when iOS requires a new audio gesture, a sound-problem icon allows the user to retry activation without resetting enabled state
- the timer works on current iOS Safari while the page remains active
- the application works without connectivity after being cached
- an update is not activated during an active session and obsolete cached assets have a defined replacement strategy
- the repository contains useful README documentation
- `docs/spec.md` exists
- `disco.json` exists and documents/supports deployment to Disco
- no backend is required
