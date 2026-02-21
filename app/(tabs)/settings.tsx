import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Timer,
  Heart,
  Zap,
  Bell,
  Wind,
  BellOff,
  Minus,
  Plus,
  Play,
  Check,
  Wrench,
  Smile,
  ShieldCheck,
  Flame,
  Eye,
  Trophy,
  Sparkles,
  PartyPopper,
  ChevronDown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { SOUND_ASSETS } from "@/assets/sounds";
import { PALETTE, MOM_MODES } from "@/components/onboarding/constants";
import { useSettings, type AppSettings } from "@/hooks/use-settings";

// ─── 选项定义 ──────────────────────────────────────────────────────────────────

const FOCUS_PRESETS = [
  { label: "经典番茄", hint: "25 · 5 · 30", work: 1500, shortBreak: 300, longBreak: 1800, rounds: 4 },
  { label: "短冲刺", hint: "15 · 3 · 15", work: 900, shortBreak: 180, longBreak: 900, rounds: 4 },
  { label: "深度工作", hint: "45 · 10 · 30", work: 2700, shortBreak: 600, longBreak: 1800, rounds: 3 },
];

const ALARM_SOUNDS = [
  { value: "bell", label: "清脆铃铛", desc: "经典铃铛提示音", Icon: Bell },
  { value: "correct", label: "答对了！", desc: "妈妈认可的声音", Icon: Trophy },
  { value: "fart", label: "调皮一下", desc: "搞笑解压神器", Icon: Wind },
  { value: "magic", label: "魔法转场", desc: "优雅的过渡音效", Icon: Sparkles },
  { value: "cheer", label: "欢呼鼓掌", desc: "全场为你喝彩", Icon: PartyPopper },
  { value: "none", label: "静音", desc: "仅震动提醒", Icon: BellOff },
];

const SETTINGS_QUOTES = [
  "调完赶紧去专注！",
  "别在设置里磨时间哦",
  "磨刀不误砍柴工",
  "设置好了就去学习！",
  "妈帮你看着，别偷懒",
];

const MOM_MODE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  gentle: Smile,
  standard: ShieldCheck,
  strict: Flame,
};

// ─── 子组件 ──────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <View style={s.sectionHeader}>
      {icon}
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function SwitchRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.switchRow}>
      <Pressable
        style={s.switchTextWrap}
        onPress={() => {
          Haptics.selectionAsync();
          onChange(!value);
        }}
      >
        <Text style={s.switchLabel}>{label}</Text>
        {desc && <Text style={s.switchDesc}>{desc}</Text>}
      </Pressable>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: PALETTE.cardBorder, true: PALETTE.accent }}
        thumbColor="#fff"
        ios_backgroundColor={PALETTE.cardBorder}
      />
    </View>
  );
}

function CycleSummary({
  work,
  shortBreak,
  longBreak,
  rounds,
}: {
  work: number;
  shortBreak: number;
  longBreak: number;
  rounds: number;
}) {
  const workMin = Math.round(work / 60);
  const shortMin = Math.round(shortBreak / 60);
  const longMin = Math.round(longBreak / 60);
  const totalMin = workMin * rounds + shortMin * (rounds - 1) + longMin;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const totalText =
    hours > 0
      ? mins > 0
        ? `${hours} 小时 ${mins} 分钟`
        : `${hours} 小时`
      : `${mins} 分钟`;

  const segments: { type: "work" | "break" | "long"; flex: number }[] = [];
  for (let i = 0; i < rounds; i++) {
    segments.push({ type: "work", flex: workMin });
    if (i < rounds - 1) segments.push({ type: "break", flex: shortMin });
  }
  segments.push({ type: "long", flex: longMin });

  return (
    <View style={s.cycleSummary}>
      <View style={s.cycleBar}>
        {segments.map((seg, i) => (
          <View
            key={i}
            style={[
              s.cycleSeg,
              { flex: seg.flex },
              seg.type === "work" && s.cycleSegWork,
              seg.type === "break" && s.cycleSegBreak,
              seg.type === "long" && s.cycleSegLong,
            ]}
          />
        ))}
      </View>
      <View style={s.cycleLegend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.cycleSegWork]} />
          <Text style={s.legendText}>工作</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.cycleSegBreak]} />
          <Text style={s.legendText}>短休息</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.cycleSegLong]} />
          <Text style={s.legendText}>长休息</Text>
        </View>
      </View>
      <Text style={s.cycleText}>一轮周期 ≈ {totalText}</Text>
    </View>
  );
}

function StepperRow({
  label,
  value,
  onChange,
  step,
  min,
  max,
  divisor = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  divisor?: number;
  unit: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = Math.round(value / divisor);
  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  const startEditing = () => {
    setDraft(String(displayValue));
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const num = parseInt(draft, 10);
    if (!isNaN(num) && num * divisor >= min) {
      const stored = Math.min(max, Math.max(min, num * divisor));
      onChange(stored);
    }
  };

  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControl}>
        <Pressable
          style={({ pressed }) => [
            s.stepperBtn,
            !canDecrease && s.stepperBtnDisabled,
            pressed && canDecrease && s.pressedItem,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(value - step);
          }}
          disabled={!canDecrease}
        >
          <Minus
            size={14}
            color={canDecrease ? PALETTE.accent : PALETTE.textLight}
          />
        </Pressable>

        {isEditing ? (
          <TextInput
            style={s.stepperInput}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            keyboardType="number-pad"
            returnKeyType="done"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Pressable style={s.stepperValueWrap} onPress={startEditing}>
            <Text style={s.stepperValue}>{displayValue}</Text>
            <Text style={s.stepperUnit}>{unit}</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            s.stepperBtn,
            !canIncrease && s.stepperBtnDisabled,
            pressed && canIncrease && s.pressedItem,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(value + step);
          }}
          disabled={!canIncrease}
        >
          <Plus
            size={14}
            color={canIncrease ? PALETTE.accent : PALETTE.textLight}
          />
        </Pressable>
      </View>
    </View>
  );
}

function SoundPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const selected = ALARM_SOUNDS.find((item) => item.value === value) ?? ALARM_SOUNDS[0];

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (soundValue: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Haptics.selectionAsync();
      onChange(soundValue);
      setExpanded(false);
    },
    [onChange],
  );

  const handlePreview = useCallback(
    (soundValue: string) => {
      if (soundValue === "none") return;

      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      if (playingId === soundValue) {
        setPlayingId(null);
        return;
      }

      const source = SOUND_ASSETS[soundValue];
      if (!source) {
        setPlayingId(soundValue);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setPlayingId(null), 600);
        return;
      }

      try {
        setPlayingId(soundValue);
        const player = createAudioPlayer(source);
        playerRef.current = player;
        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            setPlayingId(null);
            player.remove();
            if (playerRef.current === player) playerRef.current = null;
          }
        });
        player.play();
      } catch {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  return (
    <View>
      {/* 触发行：标签 + 当前选中 */}
      <Pressable
        style={({ pressed }) => [s.soundTrigger, pressed && s.pressedItem]}
        onPress={toggleExpanded}
      >
        <Text style={s.switchLabel}>提示音</Text>
        <View style={s.soundTriggerControl}>
          <selected.Icon size={16} color={PALETTE.accentDark} />
          <Text style={s.soundTriggerLabel}>{selected.label}</Text>
          <ChevronDown
            size={16}
            color={PALETTE.textMuted}
            style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </View>
      </Pressable>

      {/* 展开的选项列表 */}
      {expanded && (
        <View style={s.soundDropdown}>
          {ALARM_SOUNDS.map((sound) => {
            const isSelected = value === sound.value;
            const isPlaying = playingId === sound.value;
            const canPreview = sound.value !== "none";

            return (
              <Pressable
                key={sound.value}
                style={({ pressed }) => [
                  s.soundRow,
                  isSelected && s.soundRowSelected,
                  pressed && !isSelected && s.pressedItem,
                ]}
                onPress={() => handleSelect(sound.value)}
              >
                {canPreview ? (
                  <Pressable
                    style={({ pressed }) => [
                      s.soundPlayBtn,
                      isPlaying && s.soundPlayBtnActive,
                      pressed && !isPlaying && s.pressedItem,
                    ]}
                    onPress={() => handlePreview(sound.value)}
                    hitSlop={8}
                  >
                    <Play
                      size={10}
                      color={isPlaying ? "#FFF" : PALETTE.accent}
                      fill={isPlaying ? "#FFF" : PALETTE.accent}
                    />
                  </Pressable>
                ) : (
                  <View style={s.soundPlayPlaceholder} />
                )}
                <sound.Icon
                  size={18}
                  color={isSelected ? PALETTE.accentDark : PALETTE.textMuted}
                />
                <View style={s.soundTextWrap}>
                  <Text style={[s.soundName, isSelected && s.soundNameSelected]}>
                    {sound.label}
                  </Text>
                  <Text style={s.soundDesc}>{sound.desc}</Text>
                </View>
                {isSelected && (
                  <Check size={16} color={PALETTE.accent} strokeWidth={2.5} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { settings, loading, update, batchUpdate } = useSettings();

  const handleUpdate = useCallback(
    <K extends keyof Omit<AppSettings, "id">>(key: K) =>
      (value: AppSettings[K]) =>
        update(key, value),
    [update],
  );

  const quote = useMemo(
    () => SETTINGS_QUOTES[Math.floor(Math.random() * SETTINGS_QUOTES.length)],
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator color={PALETTE.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.headerArea}>
          <View style={s.headerRow}>
            <Text style={s.pageTitle}>设置</Text>
            <Wrench size={22} color={PALETTE.accent} />
          </View>
          <Text style={s.headerQuote}>{quote}</Text>
        </View>

        {/* 专注时长 */}
        <View style={s.section}>
          <SectionHeader
            icon={<Timer size={16} color={PALETTE.accent} />}
            title="专注时长"
          />
          <CycleSummary
            work={settings.workDuration}
            shortBreak={settings.shortBreakDuration}
            longBreak={settings.longBreakDuration}
            rounds={settings.roundsBeforeLongBreak}
          />
          <View style={s.divider} />
          <StepperRow
            label="工作"
            value={settings.workDuration}
            onChange={handleUpdate("workDuration")}
            step={300}
            min={300}
            max={7200}
            divisor={60}
            unit="分钟"
          />
          <StepperRow
            label="短休息"
            value={settings.shortBreakDuration}
            onChange={handleUpdate("shortBreakDuration")}
            step={60}
            min={60}
            max={1800}
            divisor={60}
            unit="分钟"
          />
          <StepperRow
            label="长休息"
            value={settings.longBreakDuration}
            onChange={handleUpdate("longBreakDuration")}
            step={300}
            min={300}
            max={3600}
            divisor={60}
            unit="分钟"
          />
          <StepperRow
            label="轮数"
            value={settings.roundsBeforeLongBreak}
            onChange={handleUpdate("roundsBeforeLongBreak")}
            step={1}
            min={1}
            max={12}
            unit="轮"
          />
          <View style={s.divider} />
          <View style={s.presetRow}>
            {FOCUS_PRESETS.map((preset) => {
              const isActive =
                preset.work === settings.workDuration &&
                preset.shortBreak === settings.shortBreakDuration &&
                preset.longBreak === settings.longBreakDuration &&
                preset.rounds === settings.roundsBeforeLongBreak;
              return (
                <Pressable
                  key={preset.label}
                  style={({ pressed }) => [
                    s.presetPill,
                    isActive && s.presetPillActive,
                    pressed && !isActive && s.pressedItem,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    batchUpdate({
                      workDuration: preset.work,
                      shortBreakDuration: preset.shortBreak,
                      longBreakDuration: preset.longBreak,
                      roundsBeforeLongBreak: preset.rounds,
                    });
                  }}
                >
                  <Text
                    style={[
                      s.presetLabel,
                      isActive && s.presetLabelActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text style={[s.presetHint, isActive && s.presetHintActive]}>
                    {preset.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 妈妈模式 */}
        <View style={s.section}>
          <SectionHeader icon={<Heart size={16} color={PALETTE.accent} />} title="妈妈模式" />
          <View style={s.momModeList}>
            {MOM_MODES.map((mode) => {
              const selected = settings.momMode === mode.value;
              return (
                <Pressable
                  key={mode.value}
                  style={({ pressed }) => [
                    s.momCard,
                    selected && s.momCardSelected,
                    pressed && !selected && s.pressedItem,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    update("momMode", mode.value);
                  }}
                >
                  <View style={s.momIconWrap}>
                    {(() => {
                      const MomIcon = MOM_MODE_ICONS[mode.value] ?? Heart;
                      return (
                        <MomIcon
                          size={20}
                          color={selected ? PALETTE.accentDark : PALETTE.textMuted}
                        />
                      );
                    })()}
                  </View>
                  <View style={s.momBody}>
                    <Text
                      style={[s.momLabel, selected && s.momLabelSelected]}
                    >
                      {mode.label}
                    </Text>
                    <Text style={s.momTagline}>{mode.tagline}</Text>
                    <Text style={s.momDesc}>{mode.desc1}</Text>
                  </View>
                  {selected && <Check size={18} color={PALETTE.accent} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 自动化 */}
        <View style={s.section}>
          <SectionHeader icon={<Zap size={16} color={PALETTE.accent} />} title="自动化" />
          <SwitchRow
            label="工作后自动休息"
            desc="完成一轮工作后自动开始休息"
            value={settings.autoStartBreak}
            onChange={handleUpdate("autoStartBreak")}
          />
          <View style={s.divider} />
          <SwitchRow
            label="休息后自动工作"
            desc="休息结束后自动开始下一轮"
            value={settings.autoStartWork}
            onChange={handleUpdate("autoStartWork")}
          />
        </View>

        {/* 提醒 */}
        <View style={s.section}>
          <SectionHeader
            icon={<Bell size={16} color={PALETTE.accent} />}
            title="提醒"
          />
          <SoundPicker
            value={settings.alarmSound}
            onChange={handleUpdate("alarmSound")}
          />
          <View style={s.divider} />
          <SwitchRow
            label="震动"
            desc="计时结束时震动提醒"
            value={settings.vibrationEnabled}
            onChange={handleUpdate("vibrationEnabled")}
          />
          <View style={s.divider} />
          <SwitchRow
            label="勿扰模式"
            desc="专注时自动开启勿扰"
            value={settings.dndEnabled}
            onChange={handleUpdate("dndEnabled")}
          />
        </View>

        <View style={s.footer}>
          <Eye size={28} color={PALETTE.textMuted} />
          <Text style={s.footerText}>妈妈一直看着你哦</Text>
          <Text style={s.versionText}>mamadoro v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 样式 ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.cream,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: PALETTE.text,
  },
  headerArea: {
    marginBottom: 20,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    marginLeft: 2,
  },
  headerQuote: {
    fontSize: 13,
    color: PALETTE.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },

  // Section
  section: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: 16,
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PALETTE.cardBorder,
    marginVertical: 14,
  },

  // Sound picker
  soundTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  soundTriggerControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PALETTE.warmWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  soundTriggerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: PALETTE.accentDark,
  },
  soundDropdown: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.warmWhite,
    overflow: "hidden",
    paddingVertical: 4,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  soundRowSelected: {
    backgroundColor: PALETTE.selectedBg,
  },
  soundPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(232, 133, 58, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  soundPlayBtnActive: {
    backgroundColor: PALETTE.accent,
  },
  soundPlayPlaceholder: {
    width: 28,
  },
  soundTextWrap: {
    flex: 1,
    gap: 1,
  },
  soundName: {
    fontSize: 14,
    fontWeight: "500",
    color: PALETTE.text,
  },
  soundNameSelected: {
    color: PALETTE.accentDark,
    fontWeight: "600",
  },
  soundDesc: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },

  // Switch row
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: PALETTE.text,
  },
  switchDesc: {
    fontSize: 12,
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // Mom mode
  momModeList: {
    gap: 10,
  },
  momCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.warmWhite,
  },
  momCardSelected: {
    backgroundColor: PALETTE.selectedBg,
    borderColor: PALETTE.selectedBorder,
  },
  momIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(232, 133, 58, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  momBody: {
    flex: 1,
    gap: 2,
  },
  momLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.text,
  },
  momLabelSelected: {
    color: PALETTE.accentDark,
  },
  momTagline: {
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  momDesc: {
    fontSize: 11,
    color: PALETTE.textLight,
    marginTop: 2,
  },
  // Cycle summary
  cycleSummary: {
    gap: 6,
  },
  cycleBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    gap: 2,
  },
  cycleSeg: {
    borderRadius: 5,
  },
  cycleSegWork: {
    backgroundColor: PALETTE.accent,
  },
  cycleSegBreak: {
    backgroundColor: "#8DC5A3",
  },
  cycleSegLong: {
    backgroundColor: "#89B5D4",
  },
  cycleLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  cycleText: {
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: "center",
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: PALETTE.text,
  },
  stepperControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.warmWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperValueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 2,
    minWidth: 56,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(232, 133, 58, 0.06)",
    borderRadius: 6,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.accentDark,
    textAlign: "center",
  },
  stepperUnit: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  stepperInput: {
    minWidth: 48,
    height: 36,
    fontSize: 15,
    fontWeight: "600",
    color: PALETTE.accentDark,
    textAlign: "center",
    paddingHorizontal: 4,
  },

  // Presets
  presetRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.warmWhite,
    alignItems: "center",
  },
  presetPillActive: {
    backgroundColor: PALETTE.selectedBg,
    borderColor: PALETTE.selectedBorder,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: PALETTE.textMuted,
  },
  presetLabelActive: {
    color: PALETTE.accentDark,
    fontWeight: "600",
  },
  presetHint: {
    fontSize: 10,
    color: PALETTE.textLight,
    marginTop: 2,
  },
  presetHintActive: {
    color: PALETTE.accent,
  },
  pressedItem: {
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  footerIcon: {
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontStyle: "italic",
  },
  versionText: {
    fontSize: 11,
    color: PALETTE.textLight,
    marginTop: 4,
  },
});
