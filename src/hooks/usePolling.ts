import { useCallback, useEffect, useRef } from 'react';

interface UsePollingOptions {
  intervalMs: number;
  /** Set false to pause entirely (e.g. until the user is known to be an admin). */
  enabled?: boolean;
  /** Run once right away (default). Otherwise the first run waits one interval. */
  immediate?: boolean;
}

/**
 * Runs `task` now and then every `intervalMs` — but only while the tab is visible.
 *
 * Plain `setInterval` kept three admin lists refreshing every 15s in every open
 * tab, including ones in the background for hours. Here a hidden tab schedules
 * nothing; coming back refreshes at once if the data is older than the interval.
 * A task that throws backs the interval off (×2, capped at ×4) and a success
 * resets it, so an unreachable server isn't hammered. Returns `refresh()` for an
 * on-demand run (it never overlaps a run already in flight).
 */
export function usePolling(
  task: () => Promise<unknown> | void,
  { intervalMs, enabled = true, immediate = true }: UsePollingOptions
): () => void {
  const taskRef = useRef(task);
  taskRef.current = task;
  const runRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;
    let failures = 0;
    let lastRunAt = immediate ? 0 : Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timer);
      if (cancelled || document.visibilityState !== 'visible') return;
      timer = setTimeout(run, intervalMs * Math.min(2 ** failures, 4));
    };

    const run = async () => {
      if (cancelled) return;
      if (inFlight) {
        schedule();
        return;
      }
      inFlight = true;
      try {
        await taskRef.current();
        failures = 0;
      } catch {
        failures += 1;
      } finally {
        inFlight = false;
        lastRunAt = Date.now();
        schedule();
      }
    };
    runRef.current = run;

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        clearTimeout(timer);
        return;
      }
      if (Date.now() - lastRunAt >= intervalMs) run();
      else schedule();
    };

    document.addEventListener('visibilitychange', onVisibility);
    if (immediate) run();
    else schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      runRef.current = null;
    };
  }, [intervalMs, enabled, immediate]);

  return useCallback(() => runRef.current?.(), []);
}
