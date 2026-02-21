import { useCallback, useEffect, useRef, useState } from "react";

export type TimerState = "idle" | "running" | "paused" | "completed";

interface UseTimerOptions {
  /** 计时总时长（秒） */
  duration: number;
  onHalfway?: () => void;
  onComplete?: () => void;
}

export function useTimer(options: UseTimerOptions) {
  const { duration } = options;
  const [state, setState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const refs = useRef({
    accumulated: 0,
    segmentStart: null as number | null,
    halfwayFired: false,
    interval: null as ReturnType<typeof setInterval> | null,
    onHalfway: options.onHalfway,
    onComplete: options.onComplete,
    duration,
  });

  refs.current.onHalfway = options.onHalfway;
  refs.current.onComplete = options.onComplete;
  refs.current.duration = duration;

  const clearTimer = useCallback(() => {
    if (refs.current.interval) {
      clearInterval(refs.current.interval);
      refs.current.interval = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    refs.current.interval = setInterval(() => {
      const r = refs.current;
      if (!r.segmentStart) return;

      const totalMs = r.accumulated + (Date.now() - r.segmentStart);
      const durationMs = r.duration * 1000;
      const secs = Math.min(Math.floor(totalMs / 1000), r.duration);

      setElapsedSeconds(secs);

      if (!r.halfwayFired && totalMs >= durationMs / 2) {
        r.halfwayFired = true;
        r.onHalfway?.();
      }

      if (totalMs >= durationMs) {
        clearTimer();
        r.segmentStart = null;
        r.accumulated = durationMs;
        setElapsedSeconds(r.duration);
        setState("completed");
        r.onComplete?.();
      }
    }, 1000);
  }, [clearTimer]);

  const start = useCallback(() => {
    refs.current.accumulated = 0;
    refs.current.segmentStart = Date.now();
    refs.current.halfwayFired = false;
    setElapsedSeconds(0);
    setState("running");
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    const r = refs.current;
    if (r.segmentStart) {
      r.accumulated += Date.now() - r.segmentStart;
      r.segmentStart = null;
    }
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    refs.current.segmentStart = Date.now();
    setState("running");
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    clearTimer();
    refs.current.accumulated = 0;
    refs.current.segmentStart = null;
    refs.current.halfwayFired = false;
    setElapsedSeconds(0);
    setState("idle");
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    state,
    remainingSeconds: duration - elapsedSeconds,
    elapsedSeconds,
    progress: duration > 0 ? elapsedSeconds / duration : 0,
    start,
    pause,
    resume,
    reset,
  };
}
