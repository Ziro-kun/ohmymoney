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
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AppText } from "../../src/components/AppText";
import { SecurityService } from "../../src/services/SecurityService";
import { DataService } from "../../src/services/DataService";
import { PinSetupModal } from "../../components/security/PinSetupModal";
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
  } = useFinanceStore();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [isPinSetupVisible, setIsPinSetupVisible] = useState(false);
  const [pinSetupMode, setPinSetupMode] = useState<"setup" | "verify">("setup");
  const [targetPinLength, setTargetPinLength] = useState<4 | 6>(4);
  const [pendingAction, setPendingAction] = useState<"change" | "disable" | null>(null);

  const handleApplyDummyData = () => {
    Alert.alert(
      "데이터 초기화",
      "기존 데이터가 모두 삭제되고 샘플 데이터가 로드됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "진행",
          style: "destructive",
          onPress: async () => {
            await applyDummyData();
            Alert.alert("완료", "샘플 데이터가 적용되었습니다.");
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    await DataService.exportData();
  };

  const handleImportData = async () => {
    Alert.alert(
      "데이터 가져오기",
      "가져오기를 진행하면 현재 앱의 모든 데이터가 삭제되고 파일의 데이터로 대체됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "가져오기",
          style: "destructive",
          onPress: async () => {
            const success = await DataService.importData();
            if (success) {
              await loadData(); // Reload store from new DB
              Alert.alert("완료", "데이터를 성공적으로 가져왔습니다.");
            }
          },
        },
      ],
    );
  };

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
        Alert.alert("오류", "이 기기에서 사용할 수 있는 생체 인증 수단이 없습니다.");
        return;
      }
      const success = await SecurityService.authenticateBiometric("생체 인증을 활성화합니다.");
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

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}>
        <View
          style={[
            styles.section,
            { backgroundColor: isDark ? "#121e33" : "#f1f5f9" },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            앱 설정
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
              <AppText style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                지정된 일자에 정기 지출/수입 내역을 가상으로 생성하여 자산에 반영합니다.
              </AppText>
            </View>
            <Switch
              value={autoGenerateVirtualTxs}
              onValueChange={setAutoGenerateVirtualTxs}
              trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
              thumbColor={"#fff"}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={20}
                color={colors.accent}
              />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              테마 변경 ({isDark ? "다크" : "라이트"})
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleApplyDummyData}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.dangerBg },
              ]}
            >
              <Ionicons name="refresh" size={20} color={colors.danger} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              샘플 데이터 로드
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
              <AppText style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                앱 실행 시 PIN 번호 입력을 요청합니다.
              </AppText>
            </View>
            <Switch
              value={isSecurityEnabled}
              onValueChange={handleToggleSecurity}
              trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
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
                <AppText style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                  FaceID / 지문 인식으로 잠금을 해제합니다.
                </AppText>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
                thumbColor={"#fff"}
              />
            </View>
          )}

          {/* PIN Length Selection (Display only when enabled) */}
          {isSecurityEnabled && (
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleChangePIN}
            >
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
          <View style={[styles.menuItem, { paddingVertical: 12, marginBottom: 0 }]}>
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
              <AppText style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                메인 화면의 자산 금액을 마스킹 처리하여 숨깁니다.
              </AppText>
            </View>
            <Switch
              value={isPrivacyMode}
              onValueChange={setPrivacyMode}
              trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
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

          {/* Export Data */}
          <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="share-outline" size={20} color={colors.accent} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              데이터 내보내기 (JSON 백업)
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* Import Data */}
          <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="download-outline" size={20} color={colors.accent} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              데이터 가져오기 (복원)
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {/* Sample Data (Moved here) */}
          <TouchableOpacity
            style={[styles.menuItem, { marginBottom: 0 }]}
            onPress={handleApplyDummyData}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.accent} />
            </View>
            <AppText style={[styles.menuLabel, { color: colors.text }]}>
              샘플 데이터 로드 (초기화)
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
          <View style={styles.infoRow}>
            <AppText
              style={[styles.infoLabel, { color: colors.textSecondary }]}
            >
              개발자
            </AppText>
            <AppText style={[styles.infoValue, { color: colors.text }]}>
              Ziro
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

const makeStyles = (c: AppColorScheme) =>
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
  });
