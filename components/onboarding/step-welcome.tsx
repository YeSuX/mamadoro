import { StyleSheet, Text, View } from "react-native";

import { PALETTE, sharedStyles } from "./constants";
import { PrimaryBtn } from "./primary-btn";

export function StepWelcome({
  onNext,
  bottomInset,
}: {
  onNext: () => void;
  bottomInset: number;
}) {
  return (
    <View style={sharedStyles.stepWrap}>
      <View style={styles.brandBlock}>
        <Text style={styles.brandName}>mamadoro</Text>
        <Text style={styles.brandTagline}>有 妈 管 着 的 番 茄 钟</Text>
      </View>
      <View
        style={[sharedStyles.btnGroup, { paddingBottom: bottomInset + 24 }]}
      >
        <PrimaryBtn label="好的妈 👋" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "300",
    color: PALETTE.text,
    letterSpacing: 3,
  },
  brandTagline: {
    fontSize: 14,
    color: PALETTE.textMuted,
    letterSpacing: 1,
  },
});
