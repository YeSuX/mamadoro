import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { type MomMode, MOM_MODE_LABELS, PALETTE, sharedStyles } from "./constants";
import { PrimaryBtn } from "./primary-btn";

export function StepComplete({
  workDuration,
  momMode,
  onStart,
  onSkip,
  bottomInset,
}: {
  workDuration: number;
  momMode: MomMode;
  onStart: () => void;
  onSkip: () => void;
  bottomInset: number;
}) {
  const minutes = workDuration / 60;

  return (
    <View style={sharedStyles.stepWrap}>
      <View style={styles.summaryCenter}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>你的设置</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>⏱</Text>
            <Text style={styles.summaryValue}>{minutes} 分钟 / 个</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>👩</Text>
            <Text style={styles.summaryValue}>{MOM_MODE_LABELS[momMode]}</Text>
          </View>
          <Text style={styles.summaryHint}>随时可以去设置修改</Text>
        </View>
      </View>
      <View style={[sharedStyles.btnGroup, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryBtn label="来，先来一个试试 🍅" onPress={onStart} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSkip();
          }}
          style={({ pressed }) => [
            styles.skipBtn,
            pressed && styles.skipBtnPressed,
          ]}
        >
          <Text style={styles.skipText}>晚点再说</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCenter: {
    flex: 1,
    justifyContent: "center",
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    padding: 20,
    gap: 12,
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
  summaryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.text,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: PALETTE.text,
  },
  summaryHint: {
    fontSize: 12,
    color: PALETTE.textLight,
    marginTop: 4,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipBtnPressed: {
    opacity: 0.6,
  },
  skipText: {
    fontSize: 14,
    color: PALETTE.textLight,
  },
});
