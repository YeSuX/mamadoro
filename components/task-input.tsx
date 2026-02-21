import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { PALETTE } from "@/components/onboarding/constants";

interface TaskInputProps {
  onConfirm: (title: string) => void;
  onSkip: () => void;
}

export function TaskInput({ onConfirm, onSkip }: TaskInputProps) {
  const [title, setTitle] = useState("");

  const canConfirm = title.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(title.trim());
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={s.root}>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="写周报、看书、背单词..."
          placeholderTextColor={PALETTE.textLight}
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
          maxLength={50}
        />
      </View>

      <View style={s.btnGroup}>
        <Pressable
          style={({ pressed }) => [
            s.confirmBtn,
            !canConfirm && s.confirmBtnDisabled,
            pressed && canConfirm && s.pressed,
          ]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Text
            style={[s.confirmBtnText, !canConfirm && s.confirmBtnTextMuted]}
          >
            就学这个 →
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSkip();
          }}
          style={({ pressed }) => [pressed && s.pressed]}
        >
          <Text style={s.skipText}>不说了，直接学</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { width: "100%", gap: 24, alignItems: "center" },
  card: {
    width: "100%",
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(45,32,22,0.06)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  input: {
    fontSize: 18,
    color: PALETTE.text,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontWeight: "500",
  },
  btnGroup: { gap: 16, alignItems: "center" },
  confirmBtn: {
    backgroundColor: PALETTE.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  confirmBtnTextMuted: { color: "rgba(255,255,255,0.6)" },
  skipText: {
    color: PALETTE.textMuted,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
