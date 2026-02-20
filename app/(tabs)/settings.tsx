import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  BellRing,
  Wind,
  BellOff,
  Volume2,
  Minus,
  Plus,
  Play,
  Check,
  Music,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { SOUND_ASSETS } from "@/assets/sounds";
import { PALETTE, MOM_MODES } from "@/components/onboarding/constants";
import { useSettings, type AppSettings } from "@/hooks/use-settings";

// ─── 选项定义 ──────────────────────────────────────────────────────────────────

const FOCUS_PRESETS = [
  { label: "经典番茄", work: 1500, shortBreak: 300, longBreak: 1800, rounds: 4 },
  { label: "短冲刺", work: 900, shortBreak: 180, longBreak: 900, rounds: 4 },
  { label: "深度工作", work: 2700, shortBreak: 600, longBreak: 1800, rounds: 3 },
];

const ALARM_SOUNDS = [
  { value: "default", label: "默认铃声", desc: "系统通知提示音", Icon: Volume2 },
  { value: "bell", label: "清脆铃声", desc: "经典闹铃声", Icon: BellRing },
  { value: "chime", label: "风铃", desc: "轻柔风铃声", Icon: Wind },
  { value: "marimba", label: "马林巴琴", desc: "温暖木琴音色", Icon: Music },
  { value: "none", label: "静音", desc: "仅震动提醒", Icon: BellOff },
];

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
        trackColor={{ false: "#E8E2D9", true: PALETTE.accent }}
        thumbColor="#fff"
        ios_backgroundColor="#E8E2D9"
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const handlePreview = useCallback(
    async (soundValue: string) => {
      if (soundValue === "none") return;

      // 停止上一个正在播放的音频
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 如果点击的是当前正在播放的，仅停止
      if (playingId === soundValue) {
        setPlayingId(null);
        return;
      }

      const source = SOUND_ASSETS[soundValue];
      if (!source) {
        // 音频文件尚未放置，用 haptic 反馈占位
        setPlayingId(soundValue);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        setTimeout(() => setPlayingId(null), 600);
        return;
      }

      try {
        setPlayingId(soundValue);
        const { sound } = await Audio.Sound.createAsync(source);
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
        await sound.playAsync();
      } catch {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  return (
    <View style={s.soundList}>
      {ALARM_SOUNDS.map((sound) => {
        const selected = value === sound.value;
        const isPlaying = playingId === sound.value;
        const canPreview = sound.value !== "none";

        return (
          <Pressable
            key={sound.value}
            style={({ pressed }) => [
              s.soundRow,
              selected && s.soundRowSelected,
              pressed && !selected && s.pressedItem,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(sound.value);
            }}
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
              color={selected ? PALETTE.accentDark : PALETTE.textMuted}
            />
            <View style={s.soundTextWrap}>
              <Text style={[s.soundName, selected && s.soundNameSelected]}>
                {sound.label}
              </Text>
              <Text style={s.soundDesc}>{sound.desc}</Text>
            </View>
            {selected && (
              <Check size={16} color={PALETTE.accent} strokeWidth={2.5} />
            )}
          </Pressable>
        );
      })}
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
        <Text style={s.pageTitle}>设置</Text>

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
                  <Text style={s.momIcon}>{mode.icon}</Text>
                  <View style={s.momBody}>
                    <Text
                      style={[s.momLabel, selected && s.momLabelSelected]}
                    >
                      {mode.label}
                    </Text>
                    <Text style={s.momTagline}>{mode.tagline}</Text>
                  </View>
                  {selected && <Text style={s.checkMark}>✓</Text>}
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
          <Text style={s.soundSectionLabel}>提示音</Text>
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

        <View style={s.bottomSpacer} />
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
    marginBottom: 20,
    marginTop: 8,
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
  soundSectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: PALETTE.textMuted,
    marginBottom: 8,
  },
  soundList: {
    gap: 2,
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
  momIcon: {
    fontSize: 24,
    lineHeight: 32,
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
  checkMark: {
    fontSize: 16,
    color: PALETTE.accent,
    fontWeight: "700",
  },
  // Cycle summary
  cycleSummary: {
    gap: 6,
  },
  cycleBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    gap: 2,
  },
  cycleSeg: {
    borderRadius: 3,
  },
  cycleSegWork: {
    backgroundColor: PALETTE.accent,
  },
  cycleSegBreak: {
    backgroundColor: "#E5D8C8",
  },
  cycleSegLong: {
    backgroundColor: PALETTE.textLight,
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
    paddingHorizontal: 2,
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
  pressedItem: {
    opacity: 0.7,
  },
  bottomSpacer: {
    height: 32,
  },
});
