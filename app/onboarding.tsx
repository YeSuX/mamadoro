import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
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
import { TypewriterText } from "@/components/onboarding/typewriter-text";
import { StepWelcome } from "@/components/onboarding/step-welcome";
import { createDefaultSettings } from "@/services/settings";

const STEPS: Step[] = [0, 1, 2, 3];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [workDuration, setWorkDuration] = useState(1500);
  const [momMode, setMomMode] = useState<MomMode>("standard");
  const [dynamicBubble, setDynamicBubble] = useState<string | null>(null);

  const contentOpacity = useSharedValue(1);
  const bubbleOpacity = useSharedValue(1);
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
      <View style={styles.bgLayer} />

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

      {/* ── 进度指示器 ── */}
      <View style={styles.indicator}>
        <Pressable
          style={styles.backBtn}
          onPress={goBack}
          hitSlop={12}
          disabled={step === 0}
        >
          {step > 0 && <Text style={styles.backText}>‹</Text>}
        </Pressable>
        <View style={styles.dots}>
          {STEPS.map((s) => (
            <View
              key={s}
              style={[styles.dot, s <= step && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.backBtn} />
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
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PALETTE.cream,
  },
  mamaZone: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
    borderRadius: 16,
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
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mamaEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  thumbEmoji: {
    position: "absolute",
    bottom: -4,
    right: -4,
    fontSize: 20,
  },

  // ── 进度指示器 ──
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    fontWeight: "300",
    color: PALETTE.textMuted,
    lineHeight: 32,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: PALETTE.cardBorder,
  },
  dotActive: {
    backgroundColor: PALETTE.accent,
  },

  contentZone: {
    flex: 1,
  },
});
