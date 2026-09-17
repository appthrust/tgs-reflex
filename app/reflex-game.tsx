"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitScore } from "./actions";
import {
  MAX_NAME_LENGTH,
  MAX_WAIT_MS,
  MIN_WAIT_MS,
  ROUNDS,
  type Leaderboard,
} from "@/lib/scores";

type Phase =
  | "idle"
  | "waiting"
  | "go"
  | "early"
  | "result"
  | "finished"
  | "submitted";

function randomWait() {
  return MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
}

function average(times: number[]) {
  if (times.length === 0) return 0;
  return Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
}

function rating(ms: number) {
  if (ms < 200) return { label: "Lightning", tone: "text-emerald-300" };
  if (ms < 250) return { label: "Sharp", tone: "text-sky-300" };
  if (ms < 320) return { label: "Human", tone: "text-slate-200" };
  return { label: "Sleepy", tone: "text-amber-300" };
}

const ARENA_CLASS: Record<Phase, string> = {
  idle: "arena-idle",
  waiting: "arena-waiting",
  go: "arena-go",
  early: "arena-early",
  result: "arena-result",
  finished: "arena-done",
  submitted: "arena-done",
};

const MEDAL = ["bg-amber-300 text-amber-950", "bg-slate-300 text-slate-900", "bg-orange-400 text-orange-950"];

export function ReflexGame({ initial }: { initial: Leaderboard }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState(0);
  const [name, setName] = useState("");
  const [board, setBoard] = useState(initial);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function armRound() {
    setPhase("waiting");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
    }, randomWait());
  }

  function start() {
    setTimes([]);
    setLastMs(0);
    setSavedId(null);
    armRound();
  }

  function tap() {
    switch (phase) {
      case "idle":
        start();
        return;
      case "early":
      case "result":
        armRound();
        return;
      case "waiting":
        if (timer.current) clearTimeout(timer.current);
        setPhase("early");
        return;
      case "go": {
        const ms = Math.round(performance.now() - goAt.current);
        const next = [...times, ms];
        setLastMs(ms);
        setTimes(next);
        setPhase(next.length >= ROUNDS ? "finished" : "result");
        return;
      }
      default:
        return;
    }
  }

  function submit() {
    startTransition(async () => {
      const before = new Set(board.entries.map((e) => e.id));
      const next = await submitScore(name, times);
      const mine = next.entries.find((e) => !before.has(e.id));
      setSavedId(mine?.id ?? null);
      setBoard(next);
      setPhase("submitted");
    });
  }

  const interactive =
    phase === "idle" ||
    phase === "waiting" ||
    phase === "go" ||
    phase === "early" ||
    phase === "result";

  const done = phase === "finished" || phase === "submitted";
  const currentRound = Math.min(times.length + (done ? 0 : 1), ROUNDS);
  const avg = average(times);
  const best = times.length ? Math.min(...times) : 0;
  const maxTime = times.length ? Math.max(...times) : 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" aria-label={`round ${currentRound} of ${ROUNDS}`}>
            {Array.from({ length: ROUNDS }, (_, i) => {
              const filled = i < times.length;
              const active = !done && i === times.length;
              return (
                <span
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    filled
                      ? "w-8 bg-emerald-400"
                      : active
                        ? "w-8 bg-white/70"
                        : "w-2.5 bg-white/15"
                  }`}
                />
              );
            })}
            <span className="ml-2 font-mono text-xs text-slate-500">
              {currentRound}/{ROUNDS}
            </span>
          </div>
          <div className="flex items-baseline gap-4 font-mono text-xs text-slate-500">
            <span>
              best{" "}
              <b className="text-base font-semibold text-slate-100">
                {best || "–"}
              </b>
            </span>
            <span>
              avg{" "}
              <b className="text-base font-semibold text-slate-100">
                {avg || "–"}
              </b>
              <span className="text-slate-500">ms</span>
            </span>
          </div>
        </div>

        {interactive ? (
          <button
            type="button"
            data-testid="arena"
            data-phase={phase}
            onPointerDown={tap}
            className={`relative flex h-[420px] w-full select-none flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl px-6 text-center text-white outline-none transition-[background,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-white/60 ${ARENA_CLASS[phase]}`}
          >
            {phase === "idle" && (
              <>
                <span className="relative flex h-24 w-24 items-center justify-center">
                  <span className="anim-ring absolute inset-0 rounded-full border-2 border-emerald-400/60" />
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
                    </svg>
                  </span>
                </span>
                <span className="mt-2 text-2xl font-semibold tracking-tight">
                  Tap to start
                </span>
                <span className="max-w-xs text-sm text-slate-400">
                  The screen turns red. When it flashes green, tap. Don&apos;t
                  jump the gun.
                </span>
              </>
            )}
            {phase === "waiting" && (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  Round {currentRound}
                </span>
                <span className="text-3xl font-semibold tracking-tight">
                  Wait for green…
                </span>
              </>
            )}
            {phase === "go" && (
              <span className="anim-pop text-7xl font-black tracking-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:text-8xl">
                TAP!
              </span>
            )}
            {phase === "early" && (
              <>
                <span className="anim-shake text-3xl font-semibold tracking-tight">
                  Too early!
                </span>
                <span className="text-sm text-white/80">
                  Tap to retry round {currentRound}.
                </span>
              </>
            )}
            {phase === "result" && (
              <>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Round {times.length}
                </span>
                <span
                  className="anim-pop font-mono text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl"
                  data-testid="last-ms"
                >
                  {lastMs}
                  <span className="ml-1 text-2xl font-medium text-slate-400">
                    ms
                  </span>
                </span>
                <span className={`text-sm font-medium ${rating(lastMs).tone}`}>
                  {rating(lastMs).label}
                </span>
                <span className="mt-2 text-sm text-slate-400">
                  Tap for the next round
                </span>
              </>
            )}
          </button>
        ) : (
          <div
            data-testid="arena"
            data-phase={phase}
            className={`flex min-h-[420px] w-full flex-col items-center justify-center gap-6 rounded-3xl px-6 py-8 text-center ${ARENA_CLASS[phase]}`}
          >
            <div className="anim-pop">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Your average
              </span>
              <p
                className="mt-1 font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl"
                data-testid="final-avg"
              >
                {avg}
                <span className="ml-1 text-2xl font-medium text-slate-400">
                  ms
                </span>
              </p>
              <p className={`mt-1 text-sm font-medium ${rating(avg).tone}`}>
                {rating(avg).label} · best {best}ms
              </p>
            </div>

            <ul className="flex w-full max-w-sm flex-col gap-1.5 font-mono text-xs">
              {times.map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-4 text-right text-slate-500">{i + 1}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span
                      className={`anim-grow block h-full rounded-full ${
                        t === best ? "bg-emerald-400" : "bg-sky-400/80"
                      }`}
                      style={{
                        width: `${Math.max(8, (t / maxTime) * 100)}%`,
                        animationDelay: `${i * 70}ms`,
                      }}
                    />
                  </span>
                  <span className="w-12 text-right tabular-nums text-slate-300">
                    {t}
                  </span>
                </li>
              ))}
            </ul>

            {phase === "finished" && (
              <form
                className="flex w-full max-w-sm flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="your name"
                  autoFocus
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:bg-white/10"
                />
                <button
                  type="submit"
                  disabled={isPending || !board.connected}
                  className="whitespace-nowrap rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-[0_10px_30px_-10px_rgba(52,211,153,0.8)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isPending
                    ? "Saving…"
                    : board.connected
                      ? "Save to leaderboard"
                      : "Leaderboard offline"}
                </button>
              </form>
            )}
            {phase === "submitted" && (
              <p className="text-sm text-emerald-300">
                Saved to the leaderboard.
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Play again
            </button>
          </div>
        )}
      </section>

      <aside className="glass flex flex-col overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Fastest reflexes
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              board.connected ? "text-emerald-300" : "text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                board.connected ? "bg-emerald-400" : "bg-slate-600"
              }`}
            />
            {board.connected ? "live" : "offline"}
          </span>
        </div>
        <ol className="flex-1 divide-y divide-white/5" data-testid="leaderboard">
          {board.entries.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-slate-500">
              No scores yet. Be the first.
            </li>
          ) : (
            board.entries.map((entry, index) => {
              const mine = entry.id === savedId;
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                    mine ? "bg-emerald-400/10" : ""
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                      MEDAL[index] ?? "bg-white/5 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-slate-100">
                    {entry.name}
                    {mine && (
                      <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                        you
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    best {entry.bestMs}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                    {entry.averageMs}
                    <span className="text-[10px] font-normal text-slate-500">ms</span>
                  </span>
                </li>
              );
            })
          )}
        </ol>
        <div className="border-t border-white/5 px-5 py-3 text-[11px] text-slate-500">
          Ranked by 5-round average. Top 10.
        </div>
      </aside>
    </div>
  );
}
