import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import AnimatedRE, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AI_STRATEGIES,
  ANNUAL_INTEREST_RATE,
  SEVERITY_RATIO_MODERATE,
  SEVERITY_RATIO_SEVERE,
} from "../../constants/finance";
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AppText } from "../../src/components/AppText";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { formatNumber } from "../../src/utils/format";

const { width } = Dimensions.get("window");

type TimeUnit = "second" | "minute" | "hour" | "day";

export default function DashboardScreen() {
  const {
    isInitialized,
    loadData,
    netWorth,
    perSecondBurnRate,
    dailyBurnRate,
    isPrivacyMode,
  } = useFinanceStore();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [liveBalance, setLiveBalance] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<TimeUnit>("second");

  const [lastRefValue, setLastRefValue] = useState(0);
  const [lastRefTime, setLastRefTime] = useState(0);

  // Emphasis Mode State
  const focusMode = useSharedValue(0); // 0: Balance Focus, 1: Burn Focus

  const isLosingMoney = perSecondBurnRate > 0;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    if (isLosingMoney) {
      opacityAnim.start();
      scaleAnim.start();
    } else {
      opacityAnim.stop();
      scaleAnim.stop();
      pulseAnim.setValue(1);
      pulseScale.setValue(1);
    }
    return () => {
      opacityAnim.stop();
      scaleAnim.stop();
    };
  }, [isLosingMoney]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (isInitialized) {
      setLastRefValue(netWorth);
      setLastRefTime(Date.now());
      setLiveBalance(netWorth);
    }
  }, [isInitialized, netWorth, perSecondBurnRate]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isInitialized && lastRefTime > 0) {
        const elapsed = (Date.now() - lastRefTime) / 1000;
        setLiveBalance(lastRefValue - elapsed * perSecondBurnRate);
      }
    };
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [isInitialized, lastRefTime, lastRefValue, perSecondBurnRate]);

  useEffect(() => {
    if (isInitialized && lastRefTime > 0) {
      let tickInterval = 50;
      if (selectedUnit === "minute") tickInterval = 1000;
      else if (selectedUnit === "hour") tickInterval = 60000;
      else if (selectedUnit === "day") tickInterval = 3600000;

      const interval = setInterval(() => {
        const elapsed = (Date.now() - lastRefTime) / 1000;
        setLiveBalance(lastRefValue - elapsed * perSecondBurnRate);
      }, tickInterval);

      return () => clearInterval(interval);
    }
  }, [
    isInitialized,
    perSecondBurnRate,
    selectedUnit,
    lastRefTime,
    lastRefValue,
  ]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < -50) {
        focusMode.value = withSpring(1);
      } else if (e.translationY > 50) {
        focusMode.value = withSpring(0);
      }
    })
    .runOnJS(false);

  const balanceStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusMode.value, [0, 1], [1, 0.3]);
    const scale = interpolate(focusMode.value, [0, 1], [1, 0.85]);
    const translateY = interpolate(focusMode.value, [0, 1], [0, 120]);
    return {
      opacity,
      transform: [{ scale }, { translateY }],
      zIndex: focusMode.value === 0 ? 10 : 1,
    };
  });

  const burnStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusMode.value, [0, 1], [0.3, 1]);
    const scale = interpolate(focusMode.value, [0, 1], [0.85, 1.1]);
    const translateY = interpolate(focusMode.value, [0, 1], [0, -120]);
    return {
      opacity,
      transform: [{ scale }, { translateY }],
      zIndex: focusMode.value === 1 ? 10 : 1,
    };
  });

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <AppText style={styles.loadingAppText}>
          금융 데이터 초기화 중...
        </AppText>
      </View>
    );
  }

  const liveBalanceStr = liveBalance.toFixed(1);
  const parts = liveBalanceStr.startsWith("-")
    ? liveBalanceStr.substring(1).split(".")
    : liveBalanceStr.split(".");
  const integerPart = formatNumber(parts[0]).split(".")[0];
  const decimalPart = parts[1];
  const isNegative = liveBalance < 0;

  const getRateDisplay = () => {
    switch (selectedUnit) {
      case "second":
        return { rate: perSecondBurnRate, label: "초당" };
      case "minute":
        return { rate: perSecondBurnRate * 60, label: "분당" };
      case "hour":
        return { rate: perSecondBurnRate * 3600, label: "시간당" };
      case "day":
        return { rate: dailyBurnRate, label: "일당" };
    }
  };

  const { rate, label } = getRateDisplay();
  const rateStr = rate.toFixed(1);
  const rateParts = rateStr.split(".");
  const rateInteger = formatNumber(rateParts[0]).split(".")[0];
  const rateDecimal = rateParts[1];

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient colors={colors.gradient} style={styles.background} />
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 60), // Increased buffer for navigation bar
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <AppText style={styles.title}>Tung-sim Live</AppText>
              <AppText style={styles.dateAppText}>
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
              </AppText>
            </View>
            <AppText style={styles.subTitle}>
              당신의 지갑이 비어가는 과정을 실시간으로 지켜보세요
            </AppText>
          </View>
          <View style={styles.unitSelectorContainer}>
            <View style={styles.unitSelector}>
              {[
                { id: "day", label: "일" },
                { id: "hour", label: "시" },
                { id: "minute", label: "분" },
                { id: "second", label: "초" },
              ].map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.unitBtn,
                    selectedUnit === unit.id && styles.unitBtnActive,
                  ]}
                  onPress={() => setSelectedUnit(unit.id as TimeUnit)}
                >
                  <AppText
                    style={[
                      styles.unitBtnAppText,
                      selectedUnit === unit.id && styles.unitBtnAppTextActive,
                    ]}
                  >
                    {unit.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <GestureDetector gesture={panGesture}>
            <AnimatedRE.View style={styles.cardWrapper}>
              <View style={{ height: 260, justifyContent: "center" }}>
                {/* Balance Emphasis Mode */}
                <AnimatedRE.View
                  style={[
                    styles.mainEmphasis,
                    { position: "absolute", top: 15, left: 0, right: 0 },
                    balanceStyle,
                  ]}
                >
                  <AppText
                    style={[
                      styles.emphasisLabel,
                      { color: colors.textSecondary, marginBottom: 6 },
                    ]}
                  >
                    현재 나의 순자산
                  </AppText>
                  <View style={styles.balanceSection}>
                    {isNegative && (
                      <AppText
                        style={[
                          styles.negativeSign,
                          { color: isDark ? colors.accent : colors.text },
                        ]}
                      >
                        -
                      </AppText>
                    )}
                    <AppText
                      style={[
                        styles.currencySymbol,
                        {
                          color: isDark ? colors.accent : colors.textSecondary,
                        },
                      ]}
                    >
                      ₩
                    </AppText>
                    <AppText
                      style={[
                        styles.balanceInteger,
                        { color: isDark ? colors.accent : colors.text },
                      ]}
                    >
                      {isPrivacyMode ? "••••••" : integerPart}
                    </AppText>
                    {!isPrivacyMode && (
                      <AppText
                        style={[
                          styles.balanceDecimal,
                          { color: isDark ? colors.accent : colors.textMuted },
                          { opacity: 0.8 },
                        ]}
                      >
                        .{decimalPart}
                      </AppText>
                    )}
                  </View>
                </AnimatedRE.View>

                {/* Burn Rate Emphasis Mode */}
                <AnimatedRE.View
                  style={[
                    styles.mainEmphasis,
                    { position: "absolute", top: 145, left: 0, right: 0 },
                    burnStyle,
                  ]}
                >
                  <View style={styles.burnLabelRow}>
                    {isLosingMoney && (
                      <Animated.View
                        style={[
                          styles.pulseDot,
                          {
                            backgroundColor: colors.danger,
                            opacity: pulseAnim,
                            transform: [{ scale: pulseScale }],
                          },
                        ]}
                      />
                    )}
                    <AppText
                      style={[styles.emphasisLabel, { color: colors.danger }]}
                    >
                      실시간 고정 지출 (Burn Rate)
                    </AppText>
                  </View>
                  <View style={styles.balanceSection}>
                    <AppText
                      style={[styles.negativeSign, { color: colors.danger }]}
                    >
                      -
                    </AppText>
                    <AppText
                      style={[
                        styles.currencySymbol,
                        { color: colors.danger, opacity: 0.8 },
                      ]}
                    >
                      ₩
                    </AppText>
                    <AppText
                      style={[styles.balanceInteger, { color: colors.danger }]}
                    >
                      {isPrivacyMode ? "••••" : rateInteger}
                    </AppText>
                    {!isPrivacyMode && (
                      <AppText
                        style={[
                          styles.balanceDecimal,
                          { color: colors.danger, opacity: 0.6 },
                        ]}
                      >
                        .{rateDecimal}
                      </AppText>
                    )}
                    <AppText
                      style={[
                        styles.emphasisUnitLabel,
                        {
                          color: colors.textMuted,
                          marginLeft: 8,
                          marginTop: 0,
                        },
                      ]}
                    >
                      ({label} 기준)
                    </AppText>
                  </View>
                </AnimatedRE.View>
              </View>
              <View style={styles.cardDivider} />
              <AppText style={[styles.swipeHint, { color: colors.textMuted }]}>
                ↕ 위아래로 밀면서 강조 대상을 전환하세요
              </AppText>
            </AnimatedRE.View>
          </GestureDetector>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <AppText style={styles.statLabel}>
                하루 고정 유지비 (Burn Rate)
              </AppText>
              <AppText style={[styles.statValue, { color: colors.danger }]}>
                {isPrivacyMode
                  ? "₩ •••,•••"
                  : `₩${formatNumber(Math.floor(dailyBurnRate), 0)}`}
              </AppText>
            </View>
            <AppText style={styles.statSubtext}>
              현재 내 자산을 유지하기 위해 필요한 일일 최소 금액입니다.
            </AppText>
          </View>

          <BurnMonitorCard />

          {isLosingMoney && <AICard />}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

function BurnMonitorCard() {
  const { netWorth, dailyBurnRate, isPrivacyMode } = useFinanceStore();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const DAYS_IN_MONTH = 30.44;
  const monthlyBurn = dailyBurnRate * DAYS_IN_MONTH;
  const positiveNetWorth = Math.max(netWorth, 0);

  // Months until bankruptcy: how long current assets last at current burn rate
  const monthsToBurn =
    dailyBurnRate > 0 && positiveNetWorth > 0
      ? positiveNetWorth / monthlyBurn
      : null;

  // Burn ratio: monthly expenses as % of net worth (capped at 100%)
  const burnRatio =
    positiveNetWorth > 0 ? Math.min(monthlyBurn / positiveNetWorth, 1) : 1;
  const burnPercent = Math.round(burnRatio * 100);

  // Status color based on severity
  const statusColor =
    burnPercent >= 50
      ? colors.danger
      : burnPercent >= 20
        ? "#f59e0b"
        : colors.accent;

  const monthsToBurnLabel = () => {
    if (netWorth <= 0) return "이미 적자";
    if (dailyBurnRate <= 0) return "∞ (지출 없음)";
    if (monthsToBurn === null) return "-";
    if (monthsToBurn >= 999) return "999개월 이상";
    const months = Math.floor(monthsToBurn);
    const days = Math.round((monthsToBurn - months) * DAYS_IN_MONTH);
    return days > 0 ? `${months}개월 ${days}일` : `${months}개월`;
  };

  return (
    <View style={styles.burnMonitorCard}>
      <AppText style={[styles.burnMonitorTitle, { color: colors.textMuted }]}>
        번 모니터링 (Burn Monitoring)
      </AppText>

      <View style={styles.burnMonitorRow}>
        <AppText style={[styles.burnMonitorLabel, { color: colors.textSecondary }]}>
          월 고정 지출
        </AppText>
        <AppText style={[styles.burnMonitorValue, { color: colors.danger }]}>
          {isPrivacyMode ? "₩ •••,•••" : `₩${formatNumber(Math.round(monthlyBurn), 0)}`}
        </AppText>
      </View>

      <View style={styles.burnMonitorRow}>
        <AppText style={[styles.burnMonitorLabel, { color: colors.textSecondary }]}>
          자산 소진까지
        </AppText>
        <AppText style={[styles.burnMonitorValue, { color: statusColor }]}>
          {isPrivacyMode ? "••••" : monthsToBurnLabel()}
        </AppText>
      </View>

      {/* Progress bar */}
      <View style={styles.burnBarTrack}>
        <View
          style={[
            styles.burnBarFill,
            { width: `${burnPercent}%` as any, backgroundColor: statusColor },
          ]}
        />
      </View>
      <View style={styles.burnBarLabels}>
        <AppText style={[styles.burnBarLabelText, { color: colors.textMuted }]}>
          순자산 대비 월 지출
        </AppText>
        <AppText style={[styles.burnBarLabelText, { color: statusColor, fontWeight: "700" }]}>
          {isPrivacyMode ? "••%" : `${burnPercent}%`}
        </AppText>
      </View>
    </View>
  );
}

function AICard() {
  const { netWorth, dailyBurnRate, isPrivacyMode } = useFinanceStore();
  const { colors, isDark } = useAppTheme();

  const annualInterestRate = ANNUAL_INTEREST_RATE;
  const dailyInterestRate = annualInterestRate / 365;
  const daysToRecover = 30;
  const compoundLossOver30Days =
    dailyBurnRate *
    ((Math.pow(1 + dailyInterestRate, daysToRecover) - 1) / dailyInterestRate);
  const requiredDailyWithCompound = compoundLossOver30Days / daysToRecover;
  const formattedRequiredDaily = formatNumber(
    Math.round(requiredDailyWithCompound),
  );
  const totalLoss = Math.round(compoundLossOver30Days);
  const formattedTotalLoss = formatNumber(totalLoss);
  const totalMonthlyCut = Math.round(dailyBurnRate * 3).toString();

  const strategies = AI_STRATEGIES.map((s) =>
    s.replace("{AMOUNT}", formatNumber(totalMonthlyCut)),
  );
  const severityRatio = (dailyBurnRate * 30) / (Math.abs(netWorth) || 1);
  let aiStrategyIndex = 0;
  if (severityRatio > SEVERITY_RATIO_MODERATE) aiStrategyIndex = 1;
  if (severityRatio > SEVERITY_RATIO_SEVERE) aiStrategyIndex = 2;

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.aiCard}>
      <View style={styles.statRow}>
        <AppText style={styles.aiCardLabel}>
          🤖 AI가 제안하는 30일 흑자 전환 플랜(개발중)
        </AppText>
      </View>
      <AppText style={styles.planAppText}>
        이렇게 계속 돈이 나가면, 이 돈을 저축했을 때 벌 수 있었던 이자까지
        합쳐서 30일 동안 총{" "}
        <AppText style={styles.planHighlight}>
          {isPrivacyMode ? "₩ •••,•••" : `₩${formattedTotalLoss}`}
        </AppText>
        를 손해 보는 셈이에요.{"\n\n"}• 이걸 만회하려면{" "}
        <AppText style={styles.planHighlight}>앞으로 30일 동안</AppText> 매일{" "}
        <AppText style={styles.planHighlight}>
          {isPrivacyMode ? "₩ •••,•••" : `₩${formattedRequiredDaily}`}
        </AppText>{" "}
        이상은 더 벌거나 아껴야 해요.{"\n"}• AI의 족집게 제안:{" "}
        <AppText style={styles.planHighlight}>
          {strategies[aiStrategyIndex]}
        </AppText>
      </AppText>
    </View>
  );
}

const makeStyles = (c: AppColorScheme, isDark: boolean) =>
  StyleSheet.create({
    // ── Layout ──────────────────────────────────────────────
    container: { flex: 1, backgroundColor: c.bg },
    loadingContainer: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingAppText: { color: c.textMuted, fontSize: 16 },
    background: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },

    // ── Header ──────────────────────────────────────────────
    header: { marginBottom: 20 },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      color: c.text,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    dateAppText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    subTitle: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 17,
    },
    slogan: { color: c.textMuted, fontSize: 11 },

    // ── Unit Selector ────────────────────────────────────────
    unitSelectorContainer: { marginBottom: 12 },
    unitSelector: {
      flexDirection: "row",
      justifyContent: "center",
      backgroundColor: isDark ? "#1a2235" : "#edf2f7",
      alignSelf: "center",
      borderRadius: 12,
      padding: 4,
    },
    unitBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    unitBtnActive: {
      backgroundColor: isDark ? c.accent : "#e2e8f0",
    },
    unitBtnAppText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
    unitBtnAppTextActive: { color: isDark ? "#ffffff" : c.accent },

    // ── Main Card ────────────────────────────────────────────
    cardWrapper: {
      borderRadius: 28,
      padding: 24,
      paddingBottom: 16,
      marginBottom: 16,
      backgroundColor: isDark ? "#121e33" : "#f1f5f9", // Filled background instead of frame
      // Removed borderWidth and borderColor to fix Android frame artifacts
      shadowColor: isDark ? "#000" : "#cbd5e0",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 16,
    },
    cardDivider: {
      height: 1,
      backgroundColor: c.separator,
      marginTop: 12,
      marginBottom: 10,
    },
    mainEmphasis: { alignItems: "center", paddingVertical: 12 },
    emphasisLabel: { fontSize: 13, fontWeight: "600" },
    emphasisValue: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
    emphasisUnitLabel: { fontSize: 12, marginTop: 4, fontWeight: "500" },
    balanceSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    negativeSign: { fontSize: 36, fontWeight: "900", marginRight: 2 },
    currencySymbol: { fontSize: 20, fontWeight: "600", marginRight: 4 },
    balanceInteger: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
    balanceDecimal: { fontSize: 20, fontWeight: "400" },
    burnLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    pulseDot: { width: 8, height: 8, borderRadius: 4 },
    swipeHint: {
      fontSize: 11,
      textAlign: "center",
      fontWeight: "500",
      letterSpacing: 0.3,
    },

    // ── Stats Card ───────────────────────────────────────────
    statsCard: {
      backgroundColor: isDark ? "#121e33" : "#f1f5f9",
      borderRadius: 24,
      padding: 20,
      shadowColor: isDark ? "#000" : c.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
      borderWidth: 0,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    statLabel: { color: c.textSecondary, fontSize: 13, fontWeight: "500" },
    statValue: { fontSize: 20, fontWeight: "700" },
    statSubtext: { color: c.textMuted, fontSize: 12, lineHeight: 18 },

    // ── Burn Monitor Card ────────────────────────────────────
    burnMonitorCard: {
      backgroundColor: isDark ? "#121e33" : "#f1f5f9",
      borderRadius: 24,
      padding: 20,
      marginTop: 12,
      borderWidth: 0,
    },
    burnMonitorTitle: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 14,
    },
    burnMonitorRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    burnMonitorLabel: { fontSize: 13, fontWeight: "500" },
    burnMonitorValue: { fontSize: 16, fontWeight: "700" },
    burnBarTrack: {
      height: 8,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
      borderRadius: 4,
      marginTop: 8,
      overflow: "hidden",
    },
    burnBarFill: { height: "100%", borderRadius: 4 },
    burnBarLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    burnBarLabelText: { fontSize: 11 },

    // ── AI Card ──────────────────────────────────────────────
    aiCard: {
      backgroundColor: isDark ? "#1a1625" : "#f5f3ff",
      borderRadius: 24,
      padding: 20,
      marginTop: 12,
      shadowColor: c.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 2,
      borderWidth: 0,
    },
    aiCardLabel: { color: c.purple, fontSize: 14, fontWeight: "600" },
    planAppText: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 8,
      lineHeight: 22,
    },
    planHighlight: { color: c.text, fontWeight: "700" },
  });
