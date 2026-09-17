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

export function ReflexGame({ initial }: { initial: Leaderboard }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState(0);
  const [name, setName] = useState("");
  const [board, setBoard] = useState(initial);
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
    armRound();
  }

  function tap() {
    switch (phase) {
      case "idle":
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
      setBoard(await submitScore(name, times));
      setPhase("submitted");
    });
  }

  const arenaColor = {
    idle: "bg-slate-800 text-white",
    waiting: "bg-rose-600 text-white",
    go: "bg-emerald-500 text-white",
    early: "bg-amber-500 text-white",
    result: "bg-sky-600 text-white",
    finished: "bg-white text-slate-950 border border-slate-200",
    submitted: "bg-white text-slate-950 border border-slate-200",
  }[phase];

  const interactive =
    phase === "idle" ||
    phase === "waiting" ||
    phase === "go" ||
    phase === "early" ||
    phase === "result";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-slate-600">
            round{" "}
            <b className="text-lg text-slate-950">
              {Math.min(times.length + (phase === "finished" || phase === "submitted" ? 0 : 1), ROUNDS)}
            </b>
            /{ROUNDS}
          </span>
          <span className="font-mono text-slate-600">
            avg <b className="text-lg text-slate-950">{average(times)}</b>ms
          </span>
        </div>

        {interactive ? (
          <button
            type="button"
            data-testid="arena"
            data-phase={phase}
            onPointerDown={tap}
            className={`flex h-[360px] w-full select-none flex-col items-center justify-center gap-3 rounded-xl px-6 text-center shadow-sm transition-colors ${arenaColor}`}
          >
            {phase === "idle" && (
              <>
                <span className="text-2xl font-semibold">Reflex</span>
                <span className="text-sm opacity-80">
                  Tap to start. Wait for green, then tap as fast as you can.
                  {" "}
                  {ROUNDS} rounds.
                </span>
              </>
            )}
            {phase === "waiting" && (
              <span className="text-2xl font-semibold">Wait for green…</span>
            )}
            {phase === "go" && (
              <span className="text-4xl font-bold">TAP!</span>
            )}
            {phase === "early" && (
              <>
                <span className="text-2xl font-semibold">Too early!</span>
                <span className="text-sm opacity-80">Tap to retry this round.</span>
              </>
            )}
            {phase === "result" && (
              <>
                <span className="text-5xl font-bold" data-testid="last-ms">
                  {lastMs}
                  <span className="text-2xl font-medium">ms</span>
                </span>
                <span className="text-sm opacity-80">Tap for the next round.</span>
              </>
            )}
          </button>
        ) : (
          <div
            data-testid="arena"
            data-phase={phase}
            className={`flex h-[360px] w-full flex-col items-center justify-center gap-4 rounded-xl px-6 text-center ${arenaColor}`}
          >
            <p className="text-3xl font-semibold" data-testid="final-avg">
              {average(times)}ms average
            </p>
            <p className="font-mono text-sm text-slate-500">
              {times.join(" · ")}
            </p>
            {phase === "finished" && (
              <div className="flex w-full max-w-xs flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="your name"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending || !board.connected}
                  className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPending ? "Saving…" : "Save to leaderboard"}
                </button>
              </div>
            )}
            {phase === "submitted" && (
              <p className="text-slate-600">Saved. Play again?</p>
            )}
            <button
              type="button"
              onClick={start}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Play again
            </button>
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-medium">Fastest reflexes</h2>
          <span className="text-xs text-slate-500">
            {board.connected ? "PostgreSQL" : "not connected"}
          </span>
        </div>
        <ol className="divide-y divide-slate-100" data-testid="leaderboard">
          {board.entries.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No scores yet
            </li>
          ) : (
            board.entries.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <span className="w-5 font-mono text-slate-400">
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{entry.name}</span>
                <span className="font-mono text-xs text-slate-400">
                  best {entry.bestMs}
                </span>
                <span className="font-mono font-semibold">
                  {entry.averageMs}ms
                </span>
              </li>
            ))
          )}
        </ol>
      </aside>
    </div>
  );
}
