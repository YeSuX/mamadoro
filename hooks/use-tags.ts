import { useCallback, useEffect, useState } from "react";
import { and, eq } from "drizzle-orm";

import { genId, getDb } from "@/db";
import { tags, taskTags } from "@/db/schema";

type Tag = typeof tags.$inferSelect;

export function useTags() {
  const [data, setData] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const rows = await db.select().from(tags);
      setData(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (name: string, color?: string) => {
      const db = getDb();
      const id = genId();
      await db
        .insert(tags)
        .values(color ? { id, name, color } : { id, name });
      await load();
      return id;
    },
    [load],
  );

  const addToTask = useCallback(async (taskId: string, tagId: string) => {
    const db = getDb();
    await db.insert(taskTags).values({ taskId, tagId });
  }, []);

  const removeFromTask = useCallback(async (taskId: string, tagId: string) => {
    const db = getDb();
    await db
      .delete(taskTags)
      .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }, []);

  const getTaskTags = useCallback(async (taskId: string): Promise<Tag[]> => {
    const db = getDb();
    return db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));
  }, []);

  return {
    tags: data,
    loading,
    create,
    addToTask,
    removeFromTask,
    getTaskTags,
    refresh: load,
  };
}
