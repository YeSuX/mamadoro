import { useCallback, useEffect, useState } from "react";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = "default";

export const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  workDuration: 1500,
  shortBreakDuration: 300,
  longBreakDuration: 1800,
  roundsBeforeLongBreak: 4,
  alarmSound: "default" as string,
  vibrationEnabled: true,
  dndEnabled: false,
  autoStartBreak: true,
  autoStartWork: false,
  momMode: "standard" as string,
};

export type AppSettings = typeof DEFAULT_SETTINGS;
type SettingsKey = keyof Omit<AppSettings, "id">;

export function useSettings() {
  const [data, setData] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID));
      if (rows.length > 0) {
        // 用 DEFAULT_SETTINGS 兜底，过滤 null 值
        const row = rows[0];
        setData({
          ...DEFAULT_SETTINGS,
          ...Object.fromEntries(
            Object.entries(row).filter(([, v]) => v != null),
          ),
        } as AppSettings);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async <K extends SettingsKey>(key: K, value: AppSettings[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      const db = getDb();
      const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID));
      if (rows.length > 0) {
        await db
          .update(settings)
          .set({ [key]: value })
          .where(eq(settings.id, SETTINGS_ID));
      } else {
        await db
          .insert(settings)
          .values({ ...DEFAULT_SETTINGS, [key]: value });
      }
    },
    [],
  );

  return { settings: data, loading, update };
}
