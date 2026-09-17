import { loadLeaderboard } from "@/lib/db";
import { ReflexGame } from "./reflex-game";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboard = await loadLeaderboard();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]" />
              AppThrust sample
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Reflex
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Wait for green, then tap as fast as you can. Five rounds. The
              lowest average takes the top of the board.
            </p>
          </div>
          <dl className="flex gap-6 text-xs text-slate-500">
            <div>
              <dt className="uppercase tracking-wider">Rounds</dt>
              <dd className="mt-1 font-mono text-lg text-slate-200">5</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider">Storage</dt>
              <dd className="mt-1 font-mono text-lg text-slate-200">
                {leaderboard.connected ? "PostgreSQL" : "offline"}
              </dd>
            </div>
          </dl>
        </header>

        <ReflexGame initial={leaderboard} />

        <footer className="flex flex-col gap-1 border-t border-white/5 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>
            Built with <span className="font-mono text-slate-300">apth</span>{" "}
            · scores live in managed PostgreSQL
          </span>
          <a
            href="https://github.com/appthrust/tgs-reflex"
            className="text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            github.com/appthrust/tgs-reflex
          </a>
        </footer>
      </div>
    </main>
  );
}
