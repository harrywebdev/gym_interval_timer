import './style.css';

import {
  cueForBoundary,
  nextBoundaryAfter,
  shouldPlayPlannedCue,
  type Cue,
} from './timer';

const THEME_KEY = 'theme';
const ENABLED_KEY = 'enabled';

const root = document.documentElement;
const themeSwitch = document.querySelector<HTMLButtonElement>('#theme-switch')!;
const themeColor = document.querySelector<HTMLMetaElement>(
  'meta[name="theme-color"]',
)!;
const clock = document.querySelector<HTMLTimeElement>('#clock')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
const soundProblem = document.querySelector<HTMLButtonElement>('#sound-problem')!;

// localStorage can throw in private mode or with blocked storage.
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Persistence is best-effort.
  }
}

// ---- Theme ------------------------------------------------------------------

function applyTheme(dark: boolean): void {
  root.classList.toggle('dark', dark);
  themeSwitch.setAttribute('aria-checked', String(dark));
  themeColor.content = dark ? '#0a0a0a' : '#ffffff';
}

applyTheme(root.classList.contains('dark'));

themeSwitch.addEventListener('click', () => {
  const dark = !root.classList.contains('dark');
  applyTheme(dark);
  writeStorage(THEME_KEY, dark ? 'dark' : 'light');
});

// ---- Clock ------------------------------------------------------------------

const pad = (value: number) => String(value).padStart(2, '0');

function renderClock(): void {
  const now = new Date();
  clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  clock.dateTime = now.toISOString();
}

function scheduleClockTick(): void {
  renderClock();
  // Re-derive the delay from the system clock each tick, so it never drifts.
  window.setTimeout(scheduleClockTick, 1000 - (Date.now() % 1000) + 5);
}

scheduleClockTick();

// ---- Audio ------------------------------------------------------------------

let audio: AudioContext | null = null;

async function activateAudio(): Promise<boolean> {
  try {
    audio ??= new AudioContext();
    if (audio.state !== 'running') await audio.resume();
  } catch {
    // Fall through to the state check below.
  }
  const running = audio?.state === 'running';
  soundProblem.hidden = running || !enabled;
  return running;
}

function tone(startAt: number, durationS: number, frequency: number): void {
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.6, startAt + 0.01);
  gain.gain.setValueAtTime(0.6, startAt + durationS - 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationS);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationS);
}

function playCue(cue: Cue): void {
  if (!audio || audio.state !== 'running') {
    soundProblem.hidden = false;
    return;
  }
  const start = audio.currentTime;
  if (cue.kind === 'boundary') {
    tone(start, 0.5, 1320);
    return;
  }
  for (let beep = 0; beep < cue.shortBeepCount; beep += 1) {
    tone(start + beep * 0.45, 0.3, 880);
  }
}

// ---- Cue scheduling ---------------------------------------------------------

let enabled = false;
let cueTimer: number | undefined;
let wakeLock: WakeLockSentinel | null = null;

function scheduleNextCue(): void {
  window.clearTimeout(cueTimer);
  const planned = nextBoundaryAfter(Date.now());
  cueTimer = window.setTimeout(() => {
    if (!enabled) return;
    if (shouldPlayPlannedCue(planned, Date.now())) playCue(cueForBoundary(planned));
    scheduleNextCue();
  }, planned - Date.now());
}

async function requestWakeLock(): Promise<void> {
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    wakeLock = null;
  }
}

function render(): void {
  toggle.textContent = enabled ? 'Stop' : 'Start';
  toggle.dataset.variant = enabled ? 'outline' : '';
  status.textContent = enabled ? 'Running — next cue on the quarter minute' : 'Cues every 15 seconds';
}

function setEnabled(value: boolean): void {
  enabled = value;
  writeStorage(ENABLED_KEY, value ? '1' : null);
  render();

  if (value) {
    scheduleNextCue();
    void requestWakeLock();
  } else {
    window.clearTimeout(cueTimer);
    soundProblem.hidden = true;
    void wakeLock?.release();
    wakeLock = null;
  }
}

toggle.addEventListener('click', () => {
  if (enabled) {
    setEnabled(false);
    return;
  }
  setEnabled(true);
  void activateAudio();
});

soundProblem.addEventListener('click', async () => {
  if (await activateAudio()) tone(audio!.currentTime, 0.12, 660);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !enabled) return;
  // Resume on the next future boundary; missed cues are never replayed.
  scheduleNextCue();
  void requestWakeLock();
  void activateAudio();
});

// Restore the enabled state; iOS needs a gesture before audio can play.
if (readStorage(ENABLED_KEY) === '1') {
  setEnabled(true);
  void activateAudio();
} else {
  render();
}
