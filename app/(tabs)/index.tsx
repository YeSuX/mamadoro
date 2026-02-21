import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { MamaBubble } from "@/components/mama-bubble";
import { PALETTE } from "@/components/onboarding/constants";
import { TimerRing } from "@/components/timer-ring";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useSettings } from "@/hooks/use-settings";
import { useTimer } from "@/hooks/use-timer";

type Phase = "idle" | "running" | "completed";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function HomeScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mamaBubble, setMamaBubble] = useState("今天想学点啥？");
  const [pomodoroId, setPomodoroId] = useState<string | null>(null);

  const { settings, loading: settingsLoading } = useSettings();
  const { create, complete } = usePomodoro();
  const { completedCount, refresh: refreshStats } = useDailyStats();

  const handleComplete = useCallback(async () => {
    if (pomodoroId) {
      await complete(pomodoroId, settings.workDuration);
    }
    await refreshStats();
    setPhase("completed");
    setMamaBubble("这还差不多");
    setTimeout(() => setMamaBubble("妈给你切个苹果 🍎"), 2000);
  }, [pomodoroId, settings.workDuration, complete, refreshStats]);

  const timer = useTimer({
    duration: settings.workDuration,
    onHalfway: () => setMamaBubble("过半了，加油"),
    onComplete: handleComplete,
  });

  const handleStart = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = await create(null, settings.workDuration);
    setPomodoroId(id);
    timer.start();
    setPhase("running");
    setMamaBubble("手机放远点");
  }, [create, settings.workDuration, timer]);

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

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timer.reset();
    setPomodoroId(null);
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
        {phase === "idle" && (
          <View style={s.centered}>
            <Pressable
              style={({ pressed }) => [s.bigBtn, pressed && s.bigBtnPressed]}
              onPress={handleStart}
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

        {phase === "running" && (
          <View style={s.centered}>
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

        {phase === "completed" && (
          <View style={s.centered}>
            <Text style={s.celebrationEmoji}>🍅</Text>
            <Text style={s.completedTitle}>完成！</Text>
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
  mamaSection: {
    paddingTop: 24,
  },

  // ── 主内容 ──
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: { alignItems: "center", gap: 24 },

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

  // ── 控制按钮 ──
  controls: { flexDirection: "row", gap: 16, marginTop: 8 },
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
  statsText: { fontSize: 18, color: PALETTE.textMuted, fontWeight: "500" },
});
