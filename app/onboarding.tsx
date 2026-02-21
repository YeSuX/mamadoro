import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type MomMode,
  type Step,
  MAMA_STATES,
  PALETTE,
} from "@/components/onboarding/constants";
import { StepComplete } from "@/components/onboarding/step-complete";
import { StepDuration } from "@/components/onboarding/step-duration";
import { StepMomMode } from "@/components/onboarding/step-mom-mode";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { TypewriterText } from "@/components/onboarding/typewriter-text";
import { createDefaultSettings } from "@/services/settings";

const STEPS: Step[] = [0, 1, 2, 3];

// ── 进度条片段（Stories 风格，带颜色过渡动画）────────────────────────────────────

function ProgressSegment({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const barStyle = useAnimatedStyle(() => {
    const fill = interpolate(
      progress.value,
      [index - 1, index],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      backgroundColor: interpolateColor(
        fill,
        [0, 1],
        [PALETTE.cardBorder, PALETTE.accent],
      ),
    };
  });

  return <Animated.View style={[styles.progressBar, barStyle]} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [workDuration, setWorkDuration] = useState(1500);
  const [momMode, setMomMode] = useState<MomMode>("standard");
  const [dynamicBubble, setDynamicBubble] = useState<string | null>(null);

  const contentOpacity = useSharedValue(1);
  const bubbleOpacity = useSharedValue(1);
  const displayStep = useSharedValue(0);
  const pendingStepRef = useRef<Step | null>(null);
  const pendingBubbleRef = useRef<string | null>(null);
  const isTransitioning = useRef(false);

  // ── 转场：内容区淡出→切换→淡入 ──────────────────────────────────────────────
  const applyStep = useCallback(() => {
    const next = pendingStepRef.current;
    if (next !== null) {
      setStep(next);
      setDynamicBubble(null);
      pendingStepRef.current = null;
    }
    isTransitioning.current = false;
    contentOpacity.value = withTiming(1, { duration: 280 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transitionTo = useCallback(
    (nextStep: Step) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;
      pendingStepRef.current = nextStep;
      // 进度条先行过渡，给用户即时反馈
      displayStep.value = withTiming(nextStep, { duration: 350 });
      contentOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(applyStep)();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyStep],
  );

  const goBack = useCallback(() => {
    if (step === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transitionTo((step - 1) as Step);
  }, [step, transitionTo]);

  // ── 气泡动态更新 ──────────────────────────────────────────────────────────────
  const applyBubble = useCallback(() => {
    setDynamicBubble(pendingBubbleRef.current);
    bubbleOpacity.value = withTiming(1, { duration: 180 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBubble = useCallback(
    (text: string) => {
      pendingBubbleRef.current = text;
      bubbleOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) runOnJS(applyBubble)();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyBubble],
  );

  // ── 完成引导 ──────────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(
    async (startNow: boolean) => {
      await createDefaultSettings({ workDuration, momMode });
      router.replace("/(tabs)");
      // TODO: startNow 时触发计时器开始（待计时页实现后接入）
      void startNow;
    },
    [workDuration, momMode, router],
  );

  // ── 动画样式 ──────────────────────────────────────────────────────────────────
  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
  }));

  const bubbleText = dynamicBubble ?? MAMA_STATES[step].bubble;
  const mamaEmoji = step === 3 ? "👩" : MAMA_STATES[step].emoji;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── 顶部导航 + 进度条 ── */}
      <View style={styles.progressHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={goBack}
          hitSlop={12}
          disabled={step === 0}
        >
          {step > 0 && (
            <ChevronLeft size={20} color={PALETTE.textMuted} strokeWidth={2} />
          )}
        </Pressable>
        <View style={styles.progressBars}>
          {STEPS.map((s) => (
            <ProgressSegment key={s} index={s} progress={displayStep} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* ── 妈妈固定区域 ── */}
      <View style={styles.mamaZone}>
        <View style={styles.mamaRow}>
          <Animated.View style={[styles.speechBubble, bubbleAnimStyle]}>
            <TypewriterText text={bubbleText} style={styles.bubbleText} />
            <View style={styles.bubbleTail} />
          </Animated.View>
          <View style={styles.mamaAvatarWrap}>
            <Text style={styles.mamaEmoji}>{mamaEmoji}</Text>
            {step === 3 && <Text style={styles.thumbEmoji}>👍</Text>}
          </View>
        </View>
      </View>

      {/* ── 内容区（随步骤切换）── */}
      <Animated.View style={[styles.contentZone, contentAnimStyle]}>
        {step === 0 && (
          <StepWelcome
            onNext={() => transitionTo(1)}
            bottomInset={insets.bottom}
          />
        )}
        {step === 1 && (
          <StepDuration
            selected={workDuration}
            onSelect={(v, reply) => {
              setWorkDuration(v);
              updateBubble(reply);
            }}
            onNext={() => transitionTo(2)}
            bottomInset={insets.bottom}
          />
        )}
        {step === 2 && (
          <StepMomMode
            selected={momMode}
            onSelect={(mode, reply) => {
              setMomMode(mode);
              updateBubble(reply);
            }}
            onNext={() => transitionTo(3)}
            bottomInset={insets.bottom}
          />
        )}
        {step === 3 && (
          <StepComplete
            workDuration={workDuration}
            momMode={momMode}
            onStart={() => completeOnboarding(true)}
            onSkip={() => completeOnboarding(false)}
            bottomInset={insets.bottom}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.cream,
  },

  // ── 顶部导航 + 进度条 ──
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBars: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  // ── 妈妈区域 ──
  mamaZone: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mamaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: PALETTE.bubble,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: PALETTE.bubbleShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  bubbleTail: {
    position: "absolute",
    right: -10,
    bottom: 16,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderLeftWidth: 10,
    borderLeftColor: PALETTE.bubble,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: "600",
    color: PALETTE.text,
    lineHeight: 24,
  },
  mamaAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.selectedBg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mamaEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  thumbEmoji: {
    position: "absolute",
    bottom: -2,
    right: -2,
    fontSize: 16,
  },

  contentZone: {
    flex: 1,
  },
});
