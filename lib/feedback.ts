"use client";

let ctx: AudioContext | undefined;

function audio() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = "sine",
  gain = 0.08,
) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const vol = c.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  vol.gain.setValueAtTime(gain, c.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);
  osc.connect(vol).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durationMs / 1000);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

export const feedback = {
  /** Unlock audio on the first user gesture (browsers require it). */
  prime() {
    audio();
  },
  go() {
    tone(880, 120, "square", 0.06);
    vibrate(30);
  },
  hit(ms: number) {
    tone(ms < 250 ? 1320 : 990, 90, "triangle", 0.07);
  },
  early() {
    tone(160, 220, "sawtooth", 0.05);
    vibrate([40, 40, 40]);
  },
  finish() {
    tone(660, 90, "triangle");
    setTimeout(() => tone(880, 90, "triangle"), 100);
    setTimeout(() => tone(1320, 180, "triangle"), 200);
    vibrate([20, 30, 20, 30, 60]);
  },
};
