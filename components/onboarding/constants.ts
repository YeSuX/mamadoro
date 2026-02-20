import { Platform, StyleSheet } from "react-native";

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export type Step = 0 | 1 | 2 | 3;
export type MomMode = "gentle" | "standard" | "strict";

// ─── 色板 ──────────────────────────────────────────────────────────────────────

export const PALETTE = {
  cream: "#FAF7F2",
  warmWhite: "#FFFDF9",
  cardBg: "#FFFFFF",
  cardBorder: "#F0EBE3",
  selectedBg: "#FFF4E6",
  selectedBorder: "#E8A04A",
  accent: "#E8853A",
  accentDark: "#C96D24",
  text: "#2D2016",
  textMuted: "#9A8674",
  textLight: "#C4B4A2",
  bubble: "#FFFFFF",
  bubbleShadow: "rgba(45, 32, 22, 0.08)",
  btnPrimary: "#2D2016",
  btnSecondary: "transparent",
} as const;

// ─── 妈妈步骤状态 ──────────────────────────────────────────────────────────────

export const MAMA_STATES: Record<Step, { emoji: string; bubble: string }> = {
  0: { emoji: "👩", bubble: "别看我。\n看书。" },
  1: { emoji: "👩", bubble: "妈也不指望太久，\n你先选个时间吧。" },
  2: { emoji: "👩", bubble: "你想让妈\n怎么管你？" },
  3: { emoji: "👍", bubble: "行，从今天开始\n妈管你了" },
};

// ─── P1 时长选项 ───────────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  {
    value: 900,
    icon: "🌱",
    label: "15 分钟",
    desc: "没关系，慢慢来",
    mamaReply: "没事，\n短点也行，先养成习惯",
  },
  {
    value: 1500,
    icon: "🍅",
    label: "25 分钟",
    desc: "标准番茄，刚刚好",
    recommended: true,
    mamaReply: "25 分钟，\n妈觉得刚好",
  },
  {
    value: 2700,
    icon: "🔥",
    label: "45 分钟",
    desc: "哟，挺能坐啊",
    mamaReply: "45 分钟？\n行啊你，别吹牛",
  },
] as const;

// ─── P2 妈妈模式选项 ──────────────────────────────────────────────────────────

export const MOM_MODES = [
  {
    value: "gentle" as const,
    icon: "😊",
    label: "慈母模式",
    tagline: "「宝贝加油，你最棒了」",
    desc1: "鼓励为主，温柔提醒",
    desc2: "放弃了也不骂你",
    mamaReply: "好好好，\n妈温柔着来",
  },
  {
    value: "standard" as const,
    icon: "😤",
    label: "严母模式",
    tagline: "「该夸夸，该说说」",
    desc1: "表扬与批评并存",
    desc2: "放弃了会念叨你",
    recommended: true,
    mamaReply: "严是为你好，\n懂不懂？",
  },
  {
    value: "strict" as const,
    icon: "🐯",
    label: "虎妈模式",
    tagline: "「就这？再来！」",
    desc1: "高标准严要求",
    desc2: "放弃了...后果自负",
    mamaReply: "虎妈？\n你可想好了啊",
  },
] as const;

export const MOM_MODE_LABELS: Record<MomMode, string> = {
  gentle: "慈母模式",
  standard: "严母模式",
  strict: "虎妈模式",
};

// ─── 共享样式 ──────────────────────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  stepWrap: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  cardList: {
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    position: "relative",
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
  cardSelected: {
    backgroundColor: PALETTE.selectedBg,
    borderColor: PALETTE.selectedBorder,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardIcon: {
    fontSize: 28,
    lineHeight: 36,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: PALETTE.text,
  },
  cardLabelSelected: {
    color: PALETTE.accentDark,
  },
  cardDesc: {
    fontSize: 13,
    color: PALETTE.textMuted,
  },
  recommendBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: PALETTE.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
  },
  btnGroup: {
    gap: 12,
    paddingTop: 16,
  },
});
