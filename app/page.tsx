import { loadLeaderboard } from "@/lib/db";
import { ReflexGame } from "./reflex-game";
import { ThemeToggle } from "./theme-toggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboard = await loadLeaderboard();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide text-accent-text">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_var(--accent-soft)]" />
              AppThrust sample
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Reflex
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Wait for green, then tap as fast as you can. Five rounds. The
              lowest average takes the top of the board.
            </p>
          </div>
          <div className="flex items-end gap-6">
          <dl className="flex gap-6 text-xs text-faint">
            <div>
              <dt className="uppercase tracking-wider">Rounds</dt>
              <dd className="mt-1 font-mono text-lg text-fg">5</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider">Storage</dt>
              <dd className="mt-1 font-mono text-lg text-fg">
                {leaderboard.connected ? "PostgreSQL" : "offline"}
              </dd>
            </div>
          </dl>
          <ThemeToggle />
          </div>
        </header>

        <ReflexGame initial={leaderboard} />

        <footer className="flex flex-col gap-1 border-t border-line pt-5 text-xs text-faint sm:flex-row sm:justify-between">
          <span>
            Built with <span className="font-mono text-fg">apth</span>{" "}
            · scores live in managed PostgreSQL
          </span>
          <a
            href="https://github.com/appthrust/tgs-reflex"
            className="text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            github.com/appthrust/tgs-reflex
          </a>
        </footer>
      </div>
    </main>
  );
}
