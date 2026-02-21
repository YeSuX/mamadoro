import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { PALETTE } from "@/components/onboarding/constants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STROKE_WIDTH = 8;
const DEFAULT_SIZE = 260;

interface TimerRingProps {
  /** 0 → 1 */
  progress: number;
  /** MM:SS 格式的时间文本 */
  timeLabel: string;
  /** 组件尺寸，默认 260 */
  size?: number;
  /** 是否暂停（视觉提示） */
  paused?: boolean;
}

export function TimerRing({
  progress,
  timeLabel,
  size = DEFAULT_SIZE,
  paused = false,
}: TimerRingProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* 底色轨道 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={PALETTE.cardBorder}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* 进度弧 */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={paused ? PALETTE.textMuted : PALETTE.accent}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* 居中时间 */}
      <View style={styles.labelWrap}>
        <Text
          style={[styles.timeText, paused && styles.timeTextPaused]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center", alignItems: "center" },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 56,
    fontWeight: "200",
    color: PALETTE.text,
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  timeTextPaused: { opacity: 0.4 },
});
