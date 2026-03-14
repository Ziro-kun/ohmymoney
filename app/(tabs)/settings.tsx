import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { AppText } from "../../src/components/AppText";
import { useFinanceStore } from "../../src/store/useFinanceStore";

export default function SettingsScreen() {
  const { loadData, applyDummyData } = useFinanceStore();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.text }]}>설정</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
            앱 설정
          </AppText>

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
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
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
      borderWidth: 1,
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
