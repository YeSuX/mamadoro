import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { MamaBubble } from "@/components/mama-bubble";
import { PALETTE } from "@/components/onboarding/constants";
import { TagPicker } from "@/components/tag-picker";
import { TaskInput } from "@/components/task-input";
import { TimerRing } from "@/components/timer-ring";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useSettings } from "@/hooks/use-settings";
import { useTags } from "@/hooks/use-tags";
import { useTasks } from "@/hooks/use-tasks";
import { useTimer } from "@/hooks/use-timer";

type Phase = "idle" | "taskInput" | "tagSelect" | "running" | "completed";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function HomeScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mamaBubble, setMamaBubble] = useState("今天想学点啥？");
  const [pomodoroId, setPomodoroId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);

  const { settings, loading: settingsLoading } = useSettings();
  const { create: createPomodoro, complete: completePomodoro } = usePomodoro();
  const { create: createTask, incrementPomodoro } = useTasks();
  const { tags: availableTags, create: createTag, addToTask } = useTags();
  const { completedCount, refresh: refreshStats } = useDailyStats();

  // ── 核心：开始计时 ──
  const startTimer = useCallback(
    async (forTaskId: string | null) => {
      const id = await createPomodoro(forTaskId, settings.workDuration);
      setPomodoroId(id);
      timer.start();
      setPhase("running");
      setMamaBubble("手机放远点");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timer 引用稳定
    [createPomodoro, settings.workDuration],
  );

  // ── 计时器完成回调 ──
  const handleComplete = useCallback(async () => {
    if (pomodoroId) {
      await completePomodoro(pomodoroId, settings.workDuration);
    }
    if (taskId) {
      await incrementPomodoro(taskId);
    }
    await refreshStats();
    setPhase("completed");
    setMamaBubble("这还差不多");
    setTimeout(() => setMamaBubble("妈给你切个苹果 🍎"), 2000);
  }, [
    pomodoroId,
    taskId,
    settings.workDuration,
    completePomodoro,
    incrementPomodoro,
    refreshStats,
  ]);

  const timer = useTimer({
    duration: settings.workDuration,
    onHalfway: () => setMamaBubble("过半了，加油"),
    onComplete: handleComplete,
  });

  // ── idle → taskInput ──
  const handleBegin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("taskInput");
    setMamaBubble("学什么？说！");
  }, []);

  // ── taskInput → tagSelect ──
  const handleTaskConfirm = useCallback(
    async (title: string) => {
      const id = await createTask(title);
      setTaskId(id);
      setTaskTitle(title);
      setPhase("tagSelect");
      setMamaBubble("打个标签？不打也行");
    },
    [createTask],
  );

  // ── taskInput → running（跳过任务） ──
  const handleTaskSkip = useCallback(() => {
    startTimer(null);
  }, [startTimer]);

  // ── tagSelect → running（确认标签） ──
  const handleTagsConfirm = useCallback(
    async (selectedTagIds: string[]) => {
      if (taskId && selectedTagIds.length > 0) {
        await Promise.all(
          selectedTagIds.map((tagId) => addToTask(taskId, tagId)),
        );
      }
      startTimer(taskId);
    },
    [taskId, addToTask, startTimer],
  );

  // ── tagSelect → running（跳过标签） ──
  const handleTagsSkip = useCallback(() => {
    startTimer(taskId);
  }, [taskId, startTimer]);

  // ── 暂停 / 继续 ──
  const handlePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.pause();
    setMamaBubble("偷懒呢？");
  }, [timer]);

  const handleResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.resume();
    setMamaBubble("继续继续");
  }, [timer]);

  // ── 重置 ──
  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timer.reset();
    setPomodoroId(null);
    setTaskId(null);
    setTaskTitle(null);
    setMamaBubble("今天想学点啥？");
    setPhase("idle");
  }, [timer]);

  if (settingsLoading) return null;

  return (
    <SafeAreaView style={s.container}>
      {/* ── 妈妈区域 ── */}
      <View style={s.mamaSection}>
        <MamaBubble text={mamaBubble} />
      </View>

      {/* ── 主内容 ── */}
      <View style={s.content}>
        {/* ── idle ── */}
        {phase === "idle" && (
          <View style={s.centered}>
            <Pressable
              style={({ pressed }) => [s.bigBtn, pressed && s.bigBtnPressed]}
              onPress={handleBegin}
            >
              <Text style={s.bigBtnText}>妈我学了</Text>
            </Pressable>
            {completedCount > 0 && (
              <Text style={s.subtleStats}>
                今日已完成 🍅×{completedCount}
              </Text>
            )}
          </View>
        )}

        {/* ── 任务输入 ── */}
        {phase === "taskInput" && (
          <TaskInput onConfirm={handleTaskConfirm} onSkip={handleTaskSkip} />
        )}

        {/* ── 标签选择 ── */}
        {phase === "tagSelect" && taskTitle && (
          <TagPicker
            availableTags={availableTags}
            taskTitle={taskTitle}
            onCreateTag={createTag}
            onConfirm={handleTagsConfirm}
            onSkip={handleTagsSkip}
          />
        )}

        {/* ── 计时中 ── */}
        {phase === "running" && (
          <View style={s.centered}>
            {taskTitle && (
              <View style={s.runningTaskBadge}>
                <Text style={s.runningTaskText}>📝 {taskTitle}</Text>
              </View>
            )}

            <TimerRing
              progress={timer.progress}
              timeLabel={formatTime(timer.remainingSeconds)}
              paused={timer.state === "paused"}
            />

            <View style={s.controls}>
              {timer.state === "running" && (
                <Pressable
                  style={({ pressed }) => [
                    s.controlBtn,
                    pressed && s.controlBtnPressed,
                  ]}
                  onPress={handlePause}
                >
                  <Text style={s.controlBtnText}>暂停</Text>
                </Pressable>
              )}
              {timer.state === "paused" && (
                <Pressable
                  style={({ pressed }) => [
                    s.controlBtn,
                    pressed && s.controlBtnPressed,
                  ]}
                  onPress={handleResume}
                >
                  <Text style={s.controlBtnText}>继续</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* ── 完成 ── */}
        {phase === "completed" && (
          <View style={s.centered}>
            <Text style={s.celebrationEmoji}>🍅</Text>
            <Text style={s.completedTitle}>完成！</Text>
            {taskTitle && (
              <Text style={s.completedTask}>「{taskTitle}」</Text>
            )}
            <Text style={s.statsText}>今日 🍅×{completedCount}</Text>

            <Pressable
              style={({ pressed }) => [s.bigBtn, pressed && s.bigBtnPressed]}
              onPress={handleReset}
            >
              <Text style={s.bigBtnText}>再来一个</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.cream,
  },

  // ── 妈妈 ──
  mamaSection: { paddingTop: 24 },

  // ── 主内容 ──
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: { alignItems: "center", gap: 20 },

  // ── 大按钮 ──
  bigBtn: {
    backgroundColor: PALETTE.accent,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 48,
    shadowColor: PALETTE.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  bigBtnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  bigBtnText: { color: "#FFF", fontSize: 20, fontWeight: "700" },

  // ── idle 统计 ──
  subtleStats: { fontSize: 14, color: PALETTE.textMuted },

  // ── running 任务标识 ──
  runningTaskBadge: {
    backgroundColor: PALETTE.selectedBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  runningTaskText: {
    fontSize: 14,
    color: PALETTE.accentDark,
    fontWeight: "600",
  },

  // ── 控制按钮 ──
  controls: { flexDirection: "row", gap: 16, marginTop: 4 },
  controlBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: PALETTE.cardBg,
  },
  controlBtnPressed: { opacity: 0.8 },
  controlBtnText: { fontSize: 16, fontWeight: "600", color: PALETTE.text },

  // ── 完成 ──
  celebrationEmoji: { fontSize: 64 },
  completedTitle: { fontSize: 28, fontWeight: "700", color: PALETTE.text },
  completedTask: { fontSize: 16, color: PALETTE.textMuted, fontWeight: "500" },
  statsText: { fontSize: 18, color: PALETTE.textMuted, fontWeight: "500" },
});
