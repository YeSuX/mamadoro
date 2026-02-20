import { Pressable, StyleSheet, Text, View } from "react-native";

import { type MomMode, MOM_MODES, PALETTE, sharedStyles } from "./constants";
import { PrimaryBtn } from "./primary-btn";

export function StepMomMode({
  selected,
  onSelect,
  onNext,
  bottomInset,
}: {
  selected: MomMode;
  onSelect: (mode: MomMode) => void;
  onNext: () => void;
  bottomInset: number;
}) {
  return (
    <View style={sharedStyles.stepWrap}>
      <View style={sharedStyles.cardList}>
        {MOM_MODES.map((mode) => {
          const isSelected = selected === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => onSelect(mode.value)}
              style={({ pressed }) => [
                sharedStyles.card,
                styles.cardTall,
                isSelected && sharedStyles.cardSelected,
                pressed && sharedStyles.cardPressed,
              ]}
            >
              {"recommended" in mode && mode.recommended && (
                <View style={sharedStyles.recommendBadge}>
                  <Text style={sharedStyles.recommendText}>推荐</Text>
                </View>
              )}
              <Text style={sharedStyles.cardIcon}>{mode.icon}</Text>
              <View style={sharedStyles.cardBody}>
                <Text
                  style={[
                    sharedStyles.cardLabel,
                    isSelected && sharedStyles.cardLabelSelected,
                  ]}
                >
                  {mode.label}
                </Text>
                <Text style={styles.cardTagline}>{mode.tagline}</Text>
                <Text style={sharedStyles.cardDesc}>{mode.desc1}</Text>
                <Text style={styles.cardDescMuted}>{mode.desc2}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={[sharedStyles.btnGroup, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryBtn label="选好了，下一步 →" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTall: {
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  cardTagline: {
    fontSize: 13,
    fontWeight: "500",
    color: PALETTE.accent,
    marginBottom: 4,
  },
  cardDescMuted: {
    fontSize: 12,
    color: PALETTE.textLight,
    marginTop: 2,
  },
});
