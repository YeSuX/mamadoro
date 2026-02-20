import { useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
} from "lucide-react-native";
import { PALETTE, MOM_MODES } from "@/components/onboarding/constants";
import { useSettings, type AppSettings } from "@/hooks/use-settings";

// ─── 选项定义 ──────────────────────────────────────────────────────────────────

const WORK_DURATIONS = [
  { value: 900, label: "15 分钟" },
  { value: 1500, label: "25 分钟" },
  { value: 2700, label: "45 分钟" },
];

const SHORT_BREAK_DURATIONS = [
  { value: 180, label: "3 分钟" },
  { value: 300, label: "5 分钟" },
  { value: 600, label: "10 分钟" },
];

const LONG_BREAK_DURATIONS = [
  { value: 900, label: "15 分钟" },
  { value: 1200, label: "20 分钟" },
  { value: 1800, label: "30 分钟" },
];

const ROUNDS_OPTIONS = [
  { value: 2, label: "2 轮" },
  { value: 3, label: "3 轮" },
  { value: 4, label: "4 轮" },
  { value: 6, label: "6 轮" },
];

const ALARM_SOUNDS = [
  { value: "default", label: "默认" },
  { value: "bell", label: "铃声" },
  { value: "chime", label: "风铃" },
  { value: "none", label: "静音" },
];

const ALARM_SOUND_ICONS: Record<string, React.ReactNode> = {
  default: <Volume2 size={14} color={PALETTE.textMuted} />,
  bell: <BellRing size={14} color={PALETTE.textMuted} />,
  chime: <Wind size={14} color={PALETTE.textMuted} />,
  none: <BellOff size={14} color={PALETTE.textMuted} />,
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

function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  renderIcon,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  renderIcon?: (value: T, selected: boolean) => React.ReactNode;
}) {
  return (
    <View style={s.pillRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            style={[s.pill, selected && s.pillSelected]}
            onPress={() => onChange(opt.value)}
          >
            {renderIcon?.(opt.value, selected)}
            <Text style={[s.pillLabel, selected && s.pillLabelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.settingRow}>
      <Text style={s.settingLabel}>{label}</Text>
      {children}
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
      <View style={s.switchTextWrap}>
        <Text style={s.switchLabel}>{label}</Text>
        {desc && <Text style={s.switchDesc}>{desc}</Text>}
      </View>
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

// ─── 主页面 ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { settings, loading, update } = useSettings();

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
      >
        <Text style={s.pageTitle}>设置</Text>

        {/* 专注时长 */}
        <View style={s.section}>
          <SectionHeader icon={<Timer size={16} color={PALETTE.accent} />} title="专注时长" />
          <SettingRow label="工作时长">
            <PillGroup
              options={WORK_DURATIONS}
              value={settings.workDuration}
              onChange={handleUpdate("workDuration")}
            />
          </SettingRow>
          <View style={s.divider} />
          <SettingRow label="短休息">
            <PillGroup
              options={SHORT_BREAK_DURATIONS}
              value={settings.shortBreakDuration}
              onChange={handleUpdate("shortBreakDuration")}
            />
          </SettingRow>
          <View style={s.divider} />
          <SettingRow label="长休息">
            <PillGroup
              options={LONG_BREAK_DURATIONS}
              value={settings.longBreakDuration}
              onChange={handleUpdate("longBreakDuration")}
            />
          </SettingRow>
          <View style={s.divider} />
          <SettingRow label="长休息间隔">
            <PillGroup
              options={ROUNDS_OPTIONS}
              value={settings.roundsBeforeLongBreak}
              onChange={handleUpdate("roundsBeforeLongBreak")}
            />
          </SettingRow>
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
                  style={[s.momCard, selected && s.momCardSelected]}
                  onPress={() => update("momMode", mode.value)}
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
          <SectionHeader icon={<Bell size={16} color={PALETTE.accent} />} title="提醒" />
          <SettingRow label="提示音">
            <PillGroup
              options={ALARM_SOUNDS}
              value={settings.alarmSound}
              onChange={handleUpdate("alarmSound")}
              renderIcon={(v) => ALARM_SOUND_ICONS[v]}
            />
          </SettingRow>
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

  // Setting row
  settingRow: {
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: PALETTE.text,
  },

  // Pills
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    backgroundColor: PALETTE.warmWhite,
  },
  pillSelected: {
    backgroundColor: PALETTE.selectedBg,
    borderColor: PALETTE.selectedBorder,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: PALETTE.textMuted,
  },
  pillLabelSelected: {
    color: PALETTE.accentDark,
    fontWeight: "600",
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
  bottomSpacer: {
    height: 32,
  },
});
