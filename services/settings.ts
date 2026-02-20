import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { settings } from "@/db/schema";

import type { MomMode } from "@/components/onboarding/constants";

export async function hasSettings(): Promise<boolean> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.id, "1"));
  return rows.length > 0;
}

export async function createDefaultSettings(opts: {
  workDuration: number;
  momMode: MomMode;
}): Promise<void> {
  const db = getDb();
  await db.insert(settings).values({
    id: "1",
    workDuration: opts.workDuration,
    shortBreakDuration: 300,
    longBreakDuration: 1800,
    roundsBeforeLongBreak: 4,
    alarmSound: "default",
    vibrationEnabled: true,
    dndEnabled: false,
    autoStartBreak: true,
    autoStartWork: false,
    momMode: opts.momMode,
  });
}
