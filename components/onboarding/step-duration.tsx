import { Pressable, Text, View } from "react-native";

import { DURATION_OPTIONS, sharedStyles } from "./constants";
import { PrimaryBtn } from "./primary-btn";

export function StepDuration({
  selected,
  onSelect,
  onNext,
  bottomInset,
}: {
  selected: number;
  onSelect: (value: number, mamaReply: string) => void;
  onNext: () => void;
  bottomInset: number;
}) {
  return (
    <View style={sharedStyles.stepWrap}>
      <View style={sharedStyles.cardList}>
        {DURATION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value, opt.mamaReply)}
              style={({ pressed }) => [
                sharedStyles.card,
                isSelected && sharedStyles.cardSelected,
                pressed && sharedStyles.cardPressed,
              ]}
            >
              {"recommended" in opt && opt.recommended && (
                <View style={sharedStyles.recommendBadge}>
                  <Text style={sharedStyles.recommendText}>推荐</Text>
                </View>
              )}
              <Text style={sharedStyles.cardIcon}>{opt.icon}</Text>
              <View style={sharedStyles.cardBody}>
                <Text
                  style={[
                    sharedStyles.cardLabel,
                    isSelected && sharedStyles.cardLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                <Text style={sharedStyles.cardDesc}>{opt.desc}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View
        style={[sharedStyles.btnGroup, { paddingBottom: bottomInset + 24 }]}
      >
        <PrimaryBtn label="选好了，下一步 →" onPress={onNext} />
      </View>
    </View>
  );
}
