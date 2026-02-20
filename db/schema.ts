// db/schema.ts
import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  avatar: text("avatar"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("TODO"),
  estimatedPomodoros: integer("estimated_pomodoros").default(0),
  completedPomodoros: integer("completed_pomodoros").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const pomodoros = sqliteTable("pomodoros", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  taskId: text("task_id").references(() => tasks.id),
  status: text("status").notNull(),
  plannedDuration: integer("planned_duration").notNull().default(1500),
  duration: integer("duration").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull().default("#FF6347"),
});

export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.tagId] })],
);

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  workDuration: integer("work_duration").default(1500),
  shortBreakDuration: integer("short_break_duration").default(300),
  longBreakDuration: integer("long_break_duration").default(1800),
  roundsBeforeLongBreak: integer("rounds_before_long_break").default(4),
  alarmSound: text("alarm_sound").default("default"),
  vibrationEnabled: integer("vibration_enabled", { mode: "boolean" }).default(
    true,
  ),
  dndEnabled: integer("dnd_enabled", { mode: "boolean" }).default(false),
  autoStartBreak: integer("auto_start_break", { mode: "boolean" }).default(
    true,
  ),
  autoStartWork: integer("auto_start_work", { mode: "boolean" }).default(false),
  momMode: text("mom_mode").default("standard"),
});
