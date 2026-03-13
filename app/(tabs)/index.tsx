import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import {
  ANNUAL_INTEREST_RATE,
  AI_STRATEGIES,
  SEVERITY_RATIO_MODERATE,
  SEVERITY_RATIO_SEVERE,
} from "../../constants/finance";

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
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [liveBalance, setLiveBalance] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<TimeUnit>("second");

  const [lastRefValue, setLastRefValue] = useState(0);
  const [lastRefTime, setLastRefTime] = useState(0);

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

  // Sync base values whenever store data updates or screen is focused
  useEffect(() => {
    if (isInitialized) {
      setLastRefValue(netWorth);
      setLastRefTime(Date.now());
      setLiveBalance(netWorth);
    }
  }, [isInitialized, netWorth, perSecondBurnRate]);

  // Handle AppState foreground transition
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isInitialized && lastRefTime > 0) {
        const elapsed = (Date.now() - lastRefTime) / 1000;
        setLiveBalance(lastRefValue - elapsed * perSecondBurnRate);
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [isInitialized, lastRefTime, lastRefValue, perSecondBurnRate]);

  // Ticker interval
  useEffect(() => {
    if (isInitialized && lastRefTime > 0) {
      let tickInterval = 100;
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

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>금융 데이터 초기화 중...</Text>
      </View>
    );
  }

  const parts = liveBalance.toFixed(1).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimalPart = parts[1];

  const breakEven = dailyBurnRate
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient} style={styles.background} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("ko-KR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.title}>실시간 자산 현황</Text>
            <Text style={styles.subtitle}>숨만 쉬어도 돈이 나간다</Text>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.currencySymbol}>₩</Text>
            <Text style={styles.balanceInteger}>{integerPart}</Text>
            <Text style={styles.balanceDecimal}>.{decimalPart}</Text>
          </View>

          {isLosingMoney && (
            <View>
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
                    <Text
                      style={[
                        styles.unitBtnText,
                        selectedUnit === unit.id && styles.unitBtnTextActive,
                      ]}
                    >
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.burnRateBadge}>
                <Animated.View
                  style={[styles.pulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.burnRateText}>
                  {label} ₩
                  {rate.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
                  의 고정 지출 발생 중
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>하루 고정 유지비 (Burn Rate)</Text>
              <Text style={styles.statValue}>₩{breakEven}</Text>
            </View>
            <Text style={styles.statSubtext}>
              현재 내 자산을 유지하기 위해 필요한 일일 최소 금액입니다.
            </Text>
          </View>

          {isLosingMoney &&
            (() => {
              const annualInterestRate = ANNUAL_INTEREST_RATE;
              const dailyInterestRate = annualInterestRate / 365;
              const daysToRecover = 30;
              const compoundLossOver30Days =
                dailyBurnRate *
                ((Math.pow(1 + dailyInterestRate, daysToRecover) - 1) /
                  dailyInterestRate);
              const requiredDailyWithCompound =
                compoundLossOver30Days / daysToRecover;
              const formattedRequiredDaily = requiredDailyWithCompound
                .toFixed(0)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              const pureInterestLost =
                compoundLossOver30Days - dailyBurnRate * daysToRecover;
              const formattedInterestLost = pureInterestLost
                .toFixed(0)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              const totalMonthlyCut = (dailyBurnRate * 3).toLocaleString(
                undefined,
                { maximumFractionDigits: 0 },
              );

              const strategies = AI_STRATEGIES.map((s) =>
                s.replace("{AMOUNT}", totalMonthlyCut)
              );
              const severityRatio = (dailyBurnRate * 30) / (netWorth || 1);
              let aiStrategyIndex = 0;
              if (severityRatio > SEVERITY_RATIO_MODERATE) aiStrategyIndex = 1;
              if (severityRatio > SEVERITY_RATIO_SEVERE) aiStrategyIndex = 2;

              return (
                <View style={styles.aiCard}>
                  <View style={styles.statRow}>
                    <Text style={styles.aiCardLabel}>
                      🤖 AI 맞춤 30일 흑자 전환 플랜
                    </Text>
                  </View>
                  <Text style={styles.planText}>
                    지속적인 자산 감소는 복리 이표(연 5% 가정) 측면에서 30일간
                    총{" "}
                    <Text style={styles.planHighlight}>
                      ₩{formattedInterestLost}
                    </Text>
                    의 기회비용을 추가 발생시킵니다.{"\n\n"}• 이를 상쇄하기 위해{" "}
                    <Text style={styles.planHighlight}>향후 30일 동안</Text>{" "}
                    매일{" "}
                    <Text style={styles.planHighlight}>
                      ₩{formattedRequiredDaily}
                    </Text>{" "}
                    이상의 수익을 달성해야 합니다.{"\n"}• AI 분석 제안:{" "}
                    <Text style={styles.planHighlight}>
                      {strategies[aiStrategyIndex]}
                    </Text>
                  </Text>
                </View>
              );
            })()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(c: AppColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    loadingContainer: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: { color: c.textMuted, fontSize: 16 },
    background: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

    header: { marginTop: 10, marginBottom: 30, alignItems: "center" },
    dateText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0.6,
    },
    title: {
      color: c.text,
      fontSize: 22,
      fontWeight: "700",
      marginTop: 6,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 4,
      letterSpacing: 0.4,
    },

    balanceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      marginBottom: 24,
    },
    currencySymbol: {
      color: c.textSecondary,
      fontSize: 22,
      fontWeight: "300",
      marginRight: 2,
      marginBottom: 4,
    },
    balanceInteger: {
      color: c.text,
      fontSize: Math.min(width * 0.13, 56),
      fontWeight: "700",
      letterSpacing: -2,
    },
    balanceDecimal: {
      color: c.textMuted,
      fontSize: 22,
      fontWeight: "400",
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
    unitBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
    },
    unitBtnActive: {
      backgroundColor: c.accentBg,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    unitBtnText: {
      color: c.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
    unitBtnTextActive: {
      color: c.accent,
    },

    burnRateBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: c.dangerBg,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.dangerBorder,
      marginBottom: 30,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.danger,
      marginRight: 8,
    },
    burnRateText: { color: c.danger, fontSize: 14, fontWeight: "600" },

    statsCard: {
      backgroundColor: c.card,
      borderRadius: 24,
      padding: 20,
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
      padding: 20,
      borderWidth: 1,
      borderColor: c.purpleBorder,
      marginTop: 12,
    },
    aiCardLabel: { color: c.purple, fontSize: 14, fontWeight: "600" },
    planText: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 8,
      lineHeight: 22,
    },
    planHighlight: { color: c.text, fontWeight: "700" },
  });
}
