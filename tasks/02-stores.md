# 02 — Zustand stores + hooks

- [x] `store/settingsStore.ts` — language, focusMinutes (15/25/45/50), shortBreak, longBreak,
      sessionsPerSet, flags (silence, autoStart, chime, ongoing), hasOnboarded
- [x] `store/taskStore.ts` — tasks CRUD, currentTaskId
- [x] `store/timerStore.ts` — phase/status/endAt/remainingMs/sessionNo
- [x] `store/statsStore.ts` — log session (completed + ended-early), derive stats
- [x] **Timer chạy theo timestamp `endAt`, KHÔNG đếm lùi biến đếm** — JS timer không chạy
      nền trên RN; mọi lần foreground phải recompute từ `Date.now()`
- [x] `hooks/useColors.ts`, `hooks/useT.ts`, `hooks/useHydrated.ts`
- [x] `hooks/useCountdown.ts` — tick 1s khi running + AppState listener recompute
- [x] `utils/time.ts`, `utils/date.ts`, `utils/stats.ts`
