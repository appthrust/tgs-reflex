import { loadLeaderboard } from "@/lib/db";
import { ReflexGame } from "./reflex-game";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboard = await loadLeaderboard();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-emerald-700">
            AppThrust sample
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Reflex</h1>
          <p className="mt-1 text-sm text-slate-600">
            How fast can you react? Five rounds, lowest average wins.
          </p>
        </header>
        <ReflexGame initial={leaderboard} />
        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          Built with apth · scores stored in managed PostgreSQL
        </footer>
      </div>
    </main>
  );
}
