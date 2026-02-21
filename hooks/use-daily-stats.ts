import { useCallback, useEffect, useState } from "react";
import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { pomodoros } from "@/db/schema";

export function useDailyStats() {
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(pomodoros)
        .where(
          and(
            eq(pomodoros.status, "COMPLETED"),
            sql`date(${pomodoros.startedAt}) = date('now')`,
          ),
        );
      setCompletedCount(result[0]?.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { completedCount, loading, refresh: load };
}
