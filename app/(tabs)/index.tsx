import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Platform,
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
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.15,
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
    if (isLosingMoney) {
      animation.start();
    } else {
      animation.stop();
    }
    return () => animation.stop();
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
    return { opacity, transform: [{ scale }] };
  });

  const burnStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusMode.value, [0, 1], [0.3, 1]);
    const scale = interpolate(focusMode.value, [0, 1], [0.85, 1.1]);
    return { opacity, transform: [{ scale }] };
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
              paddingBottom: Platform.OS === "ios" ? insets.bottom / 2 + 8 : 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppText style={styles.dateAppText}>
              {new Date().toLocaleDateString("ko-KR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </AppText>
            <AppText style={styles.title}>텅-장 시뮬레이터</AppText>
            <AppText style={styles.subTitle}>Tung-sim Live</AppText>
            <AppText style={styles.slogan}>"지갑의 심박수를 느끼다"</AppText>
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
              {/* Balance Emphasis Mode */}
              <AnimatedRE.View style={[styles.mainEmphasis, balanceStyle]}>
                <AppText
                  style={[
                    styles.emphasisLabel,
                    { color: colors.textSecondary },
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
                    {integerPart}
                  </AppText>
                  <AppText
                    style={[
                      styles.balanceDecimal,
                      { color: isDark ? colors.accent : colors.textMuted },
                      { opacity: 0.8 },
                    ]}
                  >
                    .{decimalPart}
                  </AppText>
                </View>
              </AnimatedRE.View>

              {/* Burn Rate Emphasis Mode */}
              <AnimatedRE.View style={[styles.mainEmphasis, burnStyle]}>
                <AppText
                  style={[styles.emphasisLabel, { color: colors.danger }]}
                >
                  실시간 고정 지출 (Burn Rate)
                </AppText>
                <View style={styles.balanceSection}>
                  <AppText style={[styles.negativeSign, { color: colors.danger }]}>
                    -
                  </AppText>
                  <AppText style={[styles.currencySymbol, { color: colors.danger, opacity: 0.8 }]}>
                    ₩
                  </AppText>
                  <AppText style={[styles.balanceInteger, { color: colors.danger }]}>
                    {rateInteger}
                  </AppText>
                  <AppText style={[styles.balanceDecimal, { color: colors.danger, opacity: 0.6 }]}>
                    .{rateDecimal}
                  </AppText>
                </View>
                <AppText
                  style={[
                    styles.emphasisUnitLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  ({label} 기준)
                </AppText>
              </AnimatedRE.View>

              <AppText style={[styles.swipeHint, { color: colors.textMuted }]}>
                위아래로 밀어 강조 대상을 전환해보세요 ↕️
              </AppText>
            </AnimatedRE.View>
          </GestureDetector>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <AppText style={styles.statLabel}>
                하루 고정 유지비 (Burn Rate)
              </AppText>
              <AppText style={styles.statValue}>
                ₩{formatNumber(dailyBurnRate)}
              </AppText>
            </View>
            <AppText style={[styles.statSubtext, { textAlign: "center" }]}>
              현재 내 자산을 유지하기 위해 필요한 일일 최소 금액입니다.
            </AppText>
          </View>

          {isLosingMoney && <AICard />}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

function AICard() {
  const { netWorth, dailyBurnRate } = useFinanceStore();
  const { colors } = useAppTheme();

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

  const styles = useMemo(() => makeStyles(colors, false), [colors]);

  return (
    <View style={styles.aiCard}>
      <View style={styles.statRow}>
        <AppText style={styles.aiCardLabel}>
          🤖 AI가 제안하는 30일 흑자 전환 플랜
        </AppText>
      </View>
      <AppText style={styles.planAppText}>
        이렇게 계속 돈이 나가면, 이 돈을 저축했을 때 벌 수 있었던 이자까지
        합쳐서 30일 동안 총{" "}
        <AppText style={styles.planHighlight}>₩{formattedTotalLoss}</AppText>를
        손해 보는 셈이에요.{"\n\n"}• 이걸 만회하려면{" "}
        <AppText style={styles.planHighlight}>앞으로 30일 동안</AppText> 매일{" "}
        <AppText style={styles.planHighlight}>₩{formattedRequiredDaily}</AppText>{" "}
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
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

    cardWrapper: {
      borderRadius: 32,
      padding: 24,
      marginBottom: 24,
      backgroundColor: isDark ? c.card : "#ffffff",
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    header: { marginBottom: 20, alignItems: "center" },
    dateAppText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.6,
    },
    title: { color: c.text, fontSize: 24, fontWeight: "900", marginTop: 4 },
    subTitle: { color: c.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 2, letterSpacing: 1 },
    slogan: { color: c.accent, fontSize: 11, fontWeight: "700", marginTop: 6, letterSpacing: 0.5 },

    mainEmphasis: {
      alignItems: "center",
      paddingVertical: 12,
    },
    emphasisLabel: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 6,
    },
    emphasisValue: {
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: -1,
    },
    emphasisUnitLabel: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: "500",
    },

    balanceSection: {
      flexDirection: "row",
      alignItems: "center", // Changed from baseline to center for better +/- alignment
      justifyContent: "center",
      marginTop: 8,
    },
    negativeSign: {
      fontSize: 36, // Match balanceInteger size
      fontWeight: "900",
      marginRight: 2,
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: "600",
      marginRight: 4,
    },
    balanceInteger: {
      fontSize: 36,
      fontWeight: "900",
      letterSpacing: -1,
    },
    balanceDecimal: {
      fontSize: 20,
      fontWeight: "400",
    },
    swipeHint: {
      fontSize: 11,
      textAlign: "center",
      marginTop: 16,
      fontWeight: "500",
      letterSpacing: 0.5,
    },

    unitSelectorContainer: {
      marginBottom: 16,
    },
    unitSelector: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 12,
      backgroundColor: c.card,
      alignSelf: "center",
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    unitBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    unitBtnActive: {
      backgroundColor: c.accentBg,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    unitBtnAppText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
    unitBtnAppTextActive: { color: c.accent },

    statsCard: {
      backgroundColor: c.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    statLabel: { color: c.textSecondary, fontSize: 14, fontWeight: "500" },
    statValue: { color: c.text, fontSize: 22, fontWeight: "700" },
    statSubtext: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 6,
      lineHeight: 18,
    },
    aiCard: {
      backgroundColor: c.purpleBg,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: c.purpleBorder,
      marginTop: 12,
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
