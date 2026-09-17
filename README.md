# Reflex

A tiny reaction-time game deployed on AppThrust with `apth`.

- Tap to start, wait for the screen to turn green, then tap as fast as you can.
- Five rounds; the lowest average wins.
- Scores are stored in the managed PostgreSQL database injected as `DATABASE_URL`.
  The table is created lazily on first use.

```bash
npm ci
npm run dev   # without DATABASE_URL the leaderboard shows "not connected"
```

Live: https://tgs-reflex.appthrust.dev/
