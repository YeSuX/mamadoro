import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PALETTE } from "@/components/onboarding/constants";

interface MamaBubbleProps {
  text: string;
  /** 打字速度，ms/字 */
  speed?: number;
}

export function MamaBubble({ text, speed = 40 }: MamaBubbleProps) {
  const [displayed, setDisplayed] = useState("");
  const prevTextRef = useRef(text);

  // 气泡弹入动画
  const bubbleScale = useSharedValue(1);

  useEffect(() => {
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;

    // 新台词入场：轻弹效果
    bubbleScale.value = withSequence(
      withTiming(0.95, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(1.03, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) }),
    );
  }, [text, bubbleScale]);

  // 打字机效果
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.root}>
      {/* 头像 */}
      <View style={styles.avatarWrap}>
        <Text style={styles.avatar}>👩</Text>
      </View>

      {/* 气泡 */}
      <Animated.View style={[styles.bubble, bubbleAnimStyle]}>
        {/* 小三角 */}
        <View style={styles.triangle} />
        {/* 透明占位，防止打字时布局抖动 */}
        <Text style={[styles.bubbleText, styles.placeholder]} aria-hidden>
          {text}
        </Text>
        <Text style={[styles.bubbleText, StyleSheet.absoluteFillObject, styles.bubbleTextInner]}>
          {displayed}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const TRIANGLE_SIZE = 8;

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 24,
  },

  // ── 头像 ──
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PALETTE.cardBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(45,32,22,0.08)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  avatar: { fontSize: 24 },

  // ── 气泡 ──
  bubble: {
    flex: 1,
    backgroundColor: PALETTE.bubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: PALETTE.bubbleShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  triangle: {
    position: "absolute",
    left: -TRIANGLE_SIZE,
    top: 14,
    width: 0,
    height: 0,
    borderTopWidth: TRIANGLE_SIZE,
    borderTopColor: "transparent",
    borderBottomWidth: TRIANGLE_SIZE,
    borderBottomColor: "transparent",
    borderRightWidth: TRIANGLE_SIZE,
    borderRightColor: PALETTE.bubble,
  },
  placeholder: { opacity: 0 },
  bubbleText: {
    fontSize: 16,
    lineHeight: 24,
    color: PALETTE.text,
    fontWeight: "500",
  },
  bubbleTextInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
