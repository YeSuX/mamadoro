import { useCallback } from "react";
import { eq } from "drizzle-orm";

import { genId, getDb } from "@/db";
import { pomodoros } from "@/db/schema";

export type PomodoroStatus = "RUNNING" | "COMPLETED" | "CANCELLED";

export function usePomodoro() {
  const create = useCallback(
    async (taskId: string | null, plannedDuration: number) => {
      const db = getDb();
      const id = genId();
      await db.insert(pomodoros).values({
        id,
        taskId,
        status: "RUNNING" satisfies PomodoroStatus,
        plannedDuration,
        duration: 0,
        startedAt: new Date().toISOString(),
      });
      return id;
    },
    [],
  );

  const complete = useCallback(async (id: string, duration: number) => {
    const db = getDb();
    await db
      .update(pomodoros)
      .set({
        status: "COMPLETED" satisfies PomodoroStatus,
        duration,
        endedAt: new Date().toISOString(),
      })
      .where(eq(pomodoros.id, id));
  }, []);

  const cancel = useCallback(async (id: string, duration: number) => {
    const db = getDb();
    await db
      .update(pomodoros)
      .set({
        status: "CANCELLED" satisfies PomodoroStatus,
        duration,
        endedAt: new Date().toISOString(),
      })
      .where(eq(pomodoros.id, id));
  }, []);

  return { create, complete, cancel };
}
