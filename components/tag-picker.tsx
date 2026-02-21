import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { PALETTE } from "@/components/onboarding/constants";

const TAG_COLORS = [
  "#4A90D9",
  "#E8853A",
  "#34C759",
  "#FF6B6B",
  "#9B59B6",
  "#F39C12",
];

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagPickerProps {
  availableTags: Tag[];
  taskTitle: string;
  onCreateTag: (name: string, color: string) => Promise<string>;
  onConfirm: (selectedTagIds: string[]) => void;
  onSkip: () => void;
}

export function TagPicker({
  availableTags,
  taskTitle,
  onCreateTag,
  onConfirm,
  onSkip,
}: TagPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const color = TAG_COLORS[availableTags.length % TAG_COLORS.length];
    const id = await onCreateTag(trimmed, color);
    setSelectedIds((prev) => new Set(prev).add(id));
    setNewName("");
    setIsCreating(false);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm([...selectedIds]);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={s.root}>
      {/* 当前任务 */}
      <View style={s.taskBadge}>
        <Text style={s.taskBadgeText}>📝 {taskTitle}</Text>
      </View>

      {/* 标签列表 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tagList}
      >
        {availableTags.map((tag) => {
          const selected = selectedIds.has(tag.id);
          return (
            <Pressable
              key={tag.id}
              style={[
                s.chip,
                { borderColor: tag.color },
                selected && { backgroundColor: tag.color },
              ]}
              onPress={() => toggle(tag.id)}
            >
              <Text style={[s.chipText, { color: tag.color }, selected && s.chipTextSelected]}>
                {tag.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable style={s.addChip} onPress={() => setIsCreating(true)}>
          <Text style={s.addChipText}>+ 新标签</Text>
        </Pressable>
      </ScrollView>

      {/* 新建标签 */}
      {isCreating && (
        <View style={s.createRow}>
          <TextInput
            style={s.createInput}
            placeholder="标签名"
            placeholderTextColor={PALETTE.textLight}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            maxLength={20}
          />
          <Pressable
            style={[s.createBtn, !newName.trim() && s.btnDisabled]}
            onPress={handleCreate}
            disabled={!newName.trim()}
          >
            <Text style={s.createBtnText}>添加</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsCreating(false);
              setNewName("");
            }}
          >
            <Text style={s.cancelText}>取消</Text>
          </Pressable>
        </View>
      )}

      {/* 操作按钮 */}
      <View style={s.btnGroup}>
        <Pressable
          style={({ pressed }) => [s.confirmBtn, pressed && s.pressed]}
          onPress={handleConfirm}
        >
          <Text style={s.confirmBtnText}>开始专注 🍅</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSkip();
          }}
          style={({ pressed }) => [pressed && s.pressed]}
        >
          <Text style={s.skipText}>跳过</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { width: "100%", gap: 20, alignItems: "center" },

  // ── 任务标识 ──
  taskBadge: {
    backgroundColor: PALETTE.selectedBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  taskBadgeText: {
    fontSize: 14,
    color: PALETTE.accentDark,
    fontWeight: "600",
  },

  // ── 标签 chips ──
  tagList: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: PALETTE.cardBg,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  chipTextSelected: { color: "#FFF" },
  addChip: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: PALETTE.textLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addChipText: { fontSize: 14, color: PALETTE.textMuted, fontWeight: "500" },

  // ── 新建标签 ──
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  createInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: PALETTE.text,
    backgroundColor: PALETTE.cardBg,
  },
  createBtn: {
    backgroundColor: PALETTE.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnDisabled: { opacity: 0.4 },
  createBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  cancelText: { color: PALETTE.textMuted, fontSize: 14 },

  // ── 操作按钮 ──
  btnGroup: { gap: 16, alignItems: "center", marginTop: 4 },
  confirmBtn: {
    backgroundColor: PALETTE.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  pressed: { opacity: 0.8 },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  skipText: {
    color: PALETTE.textMuted,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
