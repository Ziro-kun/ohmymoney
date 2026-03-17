import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PinSetupModal } from "../../components/security/PinSetupModal";
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AppText } from "../../src/components/AppText";
import { DataService } from "../../src/services/DataService";
import { SecurityService } from "../../src/services/SecurityService";
import { useFinanceStore } from "../../src/store/useFinanceStore";

export default function SettingsScreen() {
  const {
    loadData,
    applyDummyData,
    autoGenerateVirtualTxs,
    setAutoGenerateVirtualTxs,
    isPrivacyMode,
    setPrivacyMode,
    isSecurityEnabled,
    setSecurityEnabled,
    isBiometricEnabled,
    setBiometricEnabled,
    pinLength,
    setPinLength,
    clearAllData,
    isColorBlindMode,
    setColorBlindMode,
    isAutoDepreciationEnabled,
    setAutoDepreciationEnabled,
  } = useFinanceStore();
  const { colors, isDark, themeMode, setTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [isPinSetupVisible, setIsPinSetupVisible] = useState(false);
  const [pinSetupMode, setPinSetupMode] = useState<"setup" | "verify">("setup");
  const [targetPinLength, setTargetPinLength] = useState<4 | 6>(4);
  const [pendingAction, setPendingAction] = useState<
    "change" | "disable" | null
  >(null);

  const handleDataInitializationMenu = () => {
    Alert.alert(
      "데이터 초기화",
      "모든 데이터를 삭제하거나 샘플 데이터를 로드할 수 있습니다.",
      [
        {
          text: "전체 데이터 삭제 (초기화)",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "경고",
              "정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제 실행",
                  style: "destructive",
                  onPress: async () => {
                    await clearAllData();
                    Alert.alert("완료", "모든 데이터가 삭제되었습니다.");
                  },
                },
              ],
            );
          },
        },
        {
          text: "샘플 데이터 로드",
          onPress: async () => {
            await applyDummyData();
            Alert.alert("완료", "샘플 데이터가 적용되었습니다.");
          },
        },
        { text: "취소", style: "cancel" },
      ],
    );
  };

  const handleExportMenu = () => {
    Alert.alert("데이터 내보내기", "내보낼 데이터 형식을 선택해주세요.", [
      { text: "JSON (전체 백업)", onPress: handleExportData },
      { text: "CSV (거래 템플릿)", onPress: handleExportCSVTemplate },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleImportMenu = () => {
    Alert.alert("데이터 불러오기", "불러올 데이터 형식을 선택해주세요.", [
      { text: "JSON (전체 복원)", onPress: handleImportData },
      { text: "CSV (거래내역 추가)", onPress: handleImportCSV },
      { text: "취소", style: "cancel" },
    ]);
  };

  // Inner helper functions for consolidated menus
  const handleExportData = async () => {
    try {
      const success = await DataService.exportData();
      if (success) {
        Alert.alert("완료", "데이터가 성공적으로 내보내졌습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "데이터 내보내기에 실패했습니다.");
    }
  };

  const handleExportCSVTemplate = async () => {
    try {
      await DataService.exportCSVTemplate();
    } catch (error) {
      Alert.alert("오류", "CSV 템플릿을 생성하는 중 문제가 발생했습니다.");
    }
  };

  const handleImportCSV = async () => {
    Alert.alert(
      "CSV 데이터 가져오기",
      "작성하신 CSV 데이터를 현재 내역에 추가하시겠습니까? (중복 데이터가 발생할 수 있습니다)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "가져오기",
          onPress: async () => {
            try {
              const success = await DataService.importCSV();
              if (success) {
                await loadData();
                Alert.alert("완료", "거래 내역이 성공적으로 추가되었습니다.");
              }
            } catch (error: any) {
              Alert.alert(
                "오류",
                error.message || "CSV 가져오기에 실패했습니다.",
              );
            }
          },
        },
      ],
    );
  };

  const handleImportData = async () => {
    Alert.alert(
      "데이터 전체 복원",
      "전체 복원을 진행하면 현재 앱의 모든 데이터가 삭제되고 파일의 데이터로 대체됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "가져오기",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await DataService.importData();
              if (success) {
                await loadData(); // Reload store from new DB
                Alert.alert("완료", "데이터를 성공적으로 가져왔습니다.");
              }
            } catch (error: any) {
              Alert.alert(
                "오류",
                error.message || "데이터를 가져오는데 실패했습니다.",
              );
            }
          },
        },
      ],
    );
  };

  // Remaining Handlers
  const handleToggleSecurity = async (value: boolean) => {
    if (value) {
      // Prompt for PIN length
      Alert.alert("보안 설정", "사용할 PIN 번호의 길이를 선택하세요.", [
        { text: "4자리", onPress: () => startPinSetup(4) },
        { text: "6자리", onPress: () => startPinSetup(6) },
        { text: "취소", style: "cancel" },
      ]);
    } else {
      // Need to verify first
      setPinSetupMode("verify");
      setTargetPinLength(pinLength);
      setPendingAction("disable");
      setIsPinSetupVisible(true);
    }
  };

  const handleChangePIN = () => {
    setPinSetupMode("verify");
    setTargetPinLength(pinLength);
    setPendingAction("change");
    setIsPinSetupVisible(true);
  };

  const startPinSetup = (length: number) => {
    setPinSetupMode("setup");
    setTargetPinLength(length as 4 | 6);
    setIsPinSetupVisible(true);
  };

  const handlePinSetupSuccess = async (newPin?: string) => {
    if (pinSetupMode === "verify") {
      if (pendingAction === "disable") {
        await setSecurityEnabled(false);
        await SecurityService.clearPIN();
        setIsPinSetupVisible(false);
        setPendingAction(null);
        Alert.alert("알림", "보안 잠금이 해제되었습니다.");
      } else if (pendingAction === "change") {
        // Now proceed to setup
        setPinSetupMode("setup");
        // Ask for new length
        Alert.alert("PIN 변경", "새로 사용할 PIN 번호의 길이를 선택하세요.", [
          { text: "4자리", onPress: () => setTargetPinLength(4) },
          { text: "6자리", onPress: () => setTargetPinLength(6) },
        ]);
        setPendingAction(null);
      }
    } else {
      // Setup successful
      if (newPin) {
        await SecurityService.savePIN(newPin);
        await setPinLength(targetPinLength);
        await setSecurityEnabled(true);
        setIsPinSetupVisible(false);
        Alert.alert("완료", "보안 잠금이 설정되었습니다.");
      }
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const isAvailable = await SecurityService.isBiometricAvailable();
      if (!isAvailable) {
        Alert.alert(
          "오류",
          "이 기기에서 사용할 수 있는 생체 인증 수단이 없습니다.",
        );
        return;
      }
      const success =
        await SecurityService.authenticateBiometric(
          "생체 인증을 활성화합니다.",
        );
      if (success) {
        await setBiometricEnabled(true);
      }
    } else {
      await setBiometricEnabled(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.text }]}>설정</AppText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
      >
        {/* Theme Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            테마
          </AppText>

          <View
            style={[
              styles.menuItem,
              {
                paddingVertical: 12,
                flexDirection: "column",
                alignItems: "flex-start",
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={20}
                  color={colors.accent}
                />
              </View>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                화면 테마
              </AppText>
            </View>

            <View
              style={[
                styles.themePickerContainer,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
            >
              {(
                [
                  { mode: "light", icon: "sunny", label: "라이트" },
                  { mode: "dark", icon: "moon", label: "다크" },
                  {
                    mode: "system",
                    icon: "phone-portrait-outline",
                    label: "시스템",
                  },
                ] as const
              ).map(({ mode, icon, label }) => {
                const active = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themePickerButton,
                      active && {
                        backgroundColor: colors.accent,
                        shadowColor: colors.accent,
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 4,
                      },
                    ]}
                    onPress={() => setTheme(mode)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={icon}
                      size={18}
                      color={active ? "#fff" : colors.textMuted}
                      style={{ marginBottom: 5 }}
                    />
                    <AppText
                      style={[
                        styles.themePickerLabel,
                        { color: active ? "#fff" : colors.textMuted },
                      ]}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={[styles.menuItem, { paddingVertical: 12, marginBottom: 0 }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="color-palette" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                색약 모드
              </AppText>
              <AppText
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                차트 및 중요 지표의 색상을 색약자가 식별하기 쉬운 톤으로
                변경합니다.
              </AppText>
            </View>
            <Switch
              value={isColorBlindMode}
              onValueChange={setColorBlindMode}
              trackColor={{
                false: isDark ? "#333" : "#ddd",
                true: colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* Asset Settings Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            자산 설정
          </AppText>

          <View style={[styles.menuItem, { paddingVertical: 12 }]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="calendar" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                정기 내역 자동 생성
              </AppText>
              <AppText
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                지정된 일자에 정기 지출/수입 내역을 가상으로 생성하여 자산에
                반영합니다.
              </AppText>
            </View>
            <Switch
              value={autoGenerateVirtualTxs}
              onValueChange={setAutoGenerateVirtualTxs}
              trackColor={{
                false: isDark ? "#333" : "#ddd",
                true: colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>

          <View
            style={[styles.menuItem, { paddingVertical: 12, marginBottom: 0 }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="trending-down" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                감가 계산 자동화
              </AppText>
              <AppText
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                차량 등 고정 자산의 가치 하락을 실시간으로 계산하여 순자산에
                반영합니다.
              </AppText>
            </View>
            <Switch
              value={isAutoDepreciationEnabled}
              onValueChange={setAutoDepreciationEnabled}
              trackColor={{
                false: isDark ? "#333" : "#ddd",
                true: colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            보안 및 개인정보
          </AppText>

          {/* Security Master Toggle */}
          <View style={[styles.menuItem, { paddingVertical: 12 }]}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="lock-closed" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                앱 잠금 (PIN)
              </AppText>
              <AppText
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                앱 실행 시 PIN 번호 입력을 요청합니다.
              </AppText>
            </View>
            <Switch
              value={isSecurityEnabled}
              onValueChange={handleToggleSecurity}
              trackColor={{
                false: isDark ? "#333" : "#ddd",
                true: colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>

          {/* Biometric Toggle */}
          {isSecurityEnabled && (
            <View style={[styles.menuItem, { paddingVertical: 12 }]}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <Ionicons name="finger-print" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={[styles.menuLabel, { color: colors.text }]}>
                  생체 인증 사용
                </AppText>
                <AppText
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 4,
                  }}
                >
                  FaceID / 지문 인식으로 잠금을 해제합니다.
                </AppText>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{
                  false: isDark ? "#333" : "#ddd",
                  true: colors.accent,
                }}
                thumbColor={"#fff"}
              />
            </View>
          )}

          {/* PIN Length Selection (Display only when enabled) */}
          {isSecurityEnabled && (
            <TouchableOpacity style={styles.menuItem} onPress={handleChangePIN}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.accentBg },
                ]}
              >
                <Ionicons name="keypad" size={20} color={colors.accent} />
              </View>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                PIN 번호 변경 ({pinLength}자리)
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}

          {/* Privacy Mode */}
          <View
            style={[styles.menuItem, { paddingVertical: 12, marginBottom: 0 }]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="eye-off" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.menuLabel, { color: colors.text }]}>
                개인정보 보호 모드
              </AppText>
              <AppText
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                메인 화면의 자산 금액을 마스킹 처리하여 숨깁니다.
              </AppText>
            </View>
            <Switch
              value={isPrivacyMode}
              onValueChange={setPrivacyMode}
              trackColor={{
                false: isDark ? "#333" : "#ddd",
                true: colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            데이터 관리
          </AppText>

          {/* Export Data Consolidated */}
          <TouchableOpacity style={styles.menuItem} onPress={handleExportMenu}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="share-outline" size={20} color={colors.accent} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              데이터 내보내기 (JSON / CSV)
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* Import Data Consolidated */}
          <TouchableOpacity style={styles.menuItem} onPress={handleImportMenu}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.accent}
              />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              데이터 불러오기 (JSON / CSV)
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "#ffffff10" : "#00000005",
              marginVertical: 4,
              marginLeft: 48,
            }}
          />

          {/* Data Reset Consolidated */}
          <TouchableOpacity
            style={[styles.menuItem, { marginBottom: 0 }]}
            onPress={handleDataInitializationMenu}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.dangerBg },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              데이터 초기화 및 샘플 로드
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            앱 정보
          </AppText>
          <View style={styles.infoRow}>
            <AppText
              style={[styles.infoLabel, { color: colors.textSecondary }]}
            >
              앱 이름
            </AppText>
            <AppText style={[styles.infoValue, { color: colors.text }]}>
              텅-장 시뮬레이터(Tung-sim Live)
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <AppText
              style={[styles.infoLabel, { color: colors.textSecondary }]}
            >
              버전
            </AppText>
            <AppText style={[styles.infoValue, { color: colors.text }]}>
              v1.0.0
            </AppText>
          </View>
        </View>

        <AppText style={styles.footerAppText}>
          "당신의 지갑이 비어가는 과정을 실시간으로 지켜보세요"{"\n\n"}
          텅-장 시뮬레이터: Tung-sim Live
        </AppText>
      </ScrollView>

      {/* PIN Setup Modal */}
      <PinSetupModal
        isVisible={isPinSetupVisible}
        length={targetPinLength}
        mode={pinSetupMode}
        onClose={() => {
          setIsPinSetupVisible(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinSetupSuccess}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20 },
    title: { fontSize: 24, fontWeight: "800" },
    scrollContent: { padding: 20 },
    section: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 0,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 16,
      textTransform: "uppercase",
    },
    menuItem: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: "600" },
    footerAppText: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 12,
      marginTop: 40,
      letterSpacing: 0.5,
    },
    themePickerContainer: {
      flexDirection: "row",
      borderRadius: 16,
      padding: 6,
      width: "100%",
      gap: 6,
    },
    themePickerButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },
    themePickerLabel: {
      fontSize: 12,
      fontWeight: "700",
    },
  });
