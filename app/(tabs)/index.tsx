import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";

import { MamaBubble } from "@/components/mama-bubble";
import { PALETTE } from "@/components/onboarding/constants";
import { TagPicker } from "@/components/tag-picker";
import { TaskInput } from "@/components/task-input";
import { TimerRing } from "@/components/timer-ring";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useSettings } from "@/hooks/use-settings";
import { useSound } from "@/hooks/use-sound";
import { useTags } from "@/hooks/use-tags";
import { useTasks } from "@/hooks/use-tasks";
import { useTimer } from "@/hooks/use-timer";

type Phase = "idle" | "taskInput" | "tagSelect" | "running" | "completed";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getIdleGreeting(completedCount: number): string {
  const hour = new Date().getHours();
  if (completedCount >= 4) return "今天学不少了，厉害啊";
  if (completedCount > 0) return "休息够了没？再来一个";
  if (hour < 9) return "这么早？行啊你，快学";
  if (hour < 12) return "上午头脑清醒，学起来";
  if (hour < 14) return "吃完饭了？来学会儿";
  if (hour < 18) return "下午了，别光玩手机";
  if (hour < 21) return "晚上了，该学习了吧";
  return "这么晚了还学？注意身体啊";
}

export default function HomeScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mamaBubble, setMamaBubble] = useState(() => getIdleGreeting(0));
  const [pomodoroId, setPomodoroId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);

  const { settings, loading: settingsLoading } = useSettings();
  const { create: createPomodoro, complete: completePomodoro } = usePomodoro();
  const { create: createTask, incrementPomodoro } = useTasks();
  const { tags: availableTags, create: createTag, addToTask } = useTags();
  const { completedCount, refresh: refreshStats } = useDailyStats();
  const { play: playSound } = useSound();

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
    // 即时反馈：音效 + 震动
    playSound(settings.alarmSound);
    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

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
    settings.alarmSound,
    settings.vibrationEnabled,
    completePomodoro,
    incrementPomodoro,
    refreshStats,
    playSound,
  ]);

  const timer = useTimer({
    duration: settings.workDuration,
    onHalfway: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMamaBubble("过半了，加油");
    },
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
    setMamaBubble(getIdleGreeting(completedCount));
    setPhase("idle");
  }, [timer, completedCount]);

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
            <Animated.View entering={FadeIn.duration(600)}>
              <TimerRing
                progress={0}
                timeLabel={formatTime(settings.workDuration)}
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <Pressable
                style={({ pressed }) => [s.bigBtn, pressed && s.bigBtnPressed]}
                onPress={handleBegin}
              >
                <Text style={s.bigBtnText}>开始学习</Text>
              </Pressable>
            </Animated.View>

            {completedCount > 0 ? (
              <Animated.View
                entering={FadeInUp.delay(350).duration(400)}
                style={s.statsRow}
              >
                {Array.from({ length: Math.min(completedCount, 8) }).map(
                  (_, i) => (
                    <Text key={i} style={s.statsTomato}>
                      🍅
                    </Text>
                  ),
                )}
                {completedCount > 8 && (
                  <Text style={s.statsOverflow}>+{completedCount - 8}</Text>
                )}
              </Animated.View>
            ) : (
              <Animated.Text
                entering={FadeInUp.delay(350).duration(400)}
                style={s.idleHint}
              >
                第一个 🍅 等你来拿
              </Animated.Text>
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
            <Animated.Text
              entering={BounceIn.delay(100).duration(600)}
              style={s.celebrationEmoji}
            >
              🍅
            </Animated.Text>

            <Animated.Text
              entering={FadeInUp.delay(300).duration(400)}
              style={s.completedTitle}
            >
              完成！
            </Animated.Text>

            {taskTitle && (
              <Animated.Text
                entering={FadeInUp.delay(450).duration(400)}
                style={s.completedTask}
              >
                「{taskTitle}」
              </Animated.Text>
            )}

            <Animated.Text
              entering={FadeInUp.delay(600).duration(400)}
              style={s.statsText}
            >
              今日 🍅×{completedCount}
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(750).duration(400)}>
              <Pressable
                style={({ pressed }) => [s.bigBtn, pressed && s.bigBtnPressed]}
                onPress={handleReset}
              >
                <Text style={s.bigBtnText}>再来一个</Text>
              </Pressable>
            </Animated.View>
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

  // ── idle ──
  idleHint: { fontSize: 14, color: PALETTE.textMuted, fontWeight: "500" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  statsTomato: { fontSize: 20 },
  statsOverflow: {
    fontSize: 14,
    color: PALETTE.textMuted,
    fontWeight: "600",
    marginLeft: 4,
  },

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
