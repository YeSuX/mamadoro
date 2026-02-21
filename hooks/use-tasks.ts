import { useCallback, useEffect, useState } from "react";
import { eq, sql } from "drizzle-orm";

import { genId, getDb } from "@/db";
import { tasks } from "@/db/schema";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

type Task = typeof tasks.$inferSelect;

export function useTasks() {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const rows = await db.select().from(tasks);
      setData(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (title: string) => {
      const db = getDb();
      const id = genId();
      await db.insert(tasks).values({
        id,
        title,
        status: "IN_PROGRESS" satisfies TaskStatus,
      });
      await load();
      return id;
    },
    [load],
  );

  const incrementPomodoro = useCallback(
    async (taskId: string) => {
      const db = getDb();
      await db
        .update(tasks)
        .set({
          completedPomodoros: sql`coalesce(${tasks.completedPomodoros}, 0) + 1`,
        })
        .where(eq(tasks.id, taskId));
      await load();
    },
    [load],
  );

  return { tasks: data, loading, create, incrementPomodoro, refresh: load };
}
