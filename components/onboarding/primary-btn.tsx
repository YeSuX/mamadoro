import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text } from "react-native";

import { PALETTE } from "./constants";

export function PrimaryBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && styles.primaryBtnPressed,
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: PALETTE.btnPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnPressed: {
    opacity: 0.8,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
