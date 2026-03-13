import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColorScheme } from "../../constants/theme";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore, Asset, Expense } from "../../src/store/useFinanceStore";

export default function ConfigScreen() {
  const {
    isInitialized,
    loadData,
    assets,
    expenses,
    addNewAsset,
    addNewExpense,
    deleteAsset,
    deleteExpense,
  } = useFinanceStore();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<"asset" | "expense">("asset");

  const [assetName, setAssetName] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [assetType, setAssetType] = useState<Asset["type"]>("asset");

  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseFreq, setExpenseFreq] = useState<Expense["frequency"]>("monthly");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleAddAsset = async () => {
    if (!assetName.trim() || !assetAmount)
      return Alert.alert("오류", "모든 필드를 입력해주세요");
    const amount = parseFloat(assetAmount);
    if (isNaN(amount) || amount < 0) {
      return Alert.alert("오류", "유효한 금액을 양수로 입력해주세요");
    }
    try {
      await addNewAsset(assetName.trim(), amount, assetType);
      setAssetName("");
      setAssetAmount("");
      Alert.alert("성공", "항목이 추가되었습니다!");
    } catch (e) {
      Alert.alert("오류", "자산 추가 중 문제가 발생했습니다.");
    }
  };

  const handleAddExpense = async () => {
    if (!expenseName.trim() || !expenseAmount)
      return Alert.alert("오류", "모든 필드를 입력해주세요");
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount < 0) {
      return Alert.alert("오류", "유효한 금액을 양수로 입력해주세요");
    }
    try {
      await addNewExpense(expenseName.trim(), amount, expenseFreq);
      setExpenseName("");
      setExpenseAmount("");
      Alert.alert("성공", "지출이 추가되었습니다!");
    } catch (e) {
      Alert.alert("오류", "지출 추가 중 문제가 발생했습니다.");
    }
  };

  const handleDeleteAsset = (id: number, name: string) => {
    Alert.alert("삭제 확인", `${name} 항목을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
          try {
            await deleteAsset(id);
          } catch (e) {
            Alert.alert("오류", "삭제 불가");
          }
        } 
      },
    ]);
  };

  const handleDeleteExpense = (id: number, name: string) => {
    Alert.alert("삭제 확인", `${name} 지출 항목을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
          try {
            await deleteExpense(id);
          } catch (e) {
            Alert.alert("오류", "삭제 불가");
          }
        } 
      },
    ]);
  };

  const handleApplyDummyData = () => {
    Alert.alert(
      "테스트 데이터 적용",
      "기존 데이터가 모두 삭제됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "진행",
          style: "destructive",
          onPress: async () => {
            const { applyDummyData } = useFinanceStore.getState();
            await applyDummyData();
            Alert.alert("완료", "테스트 데이터가 적용되었습니다.");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>자산설정</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dummyBtn} onPress={handleApplyDummyData}>
              <Text style={styles.dummyBtnText}>테스트 데이터 로드</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "asset" && styles.activeTab]}
            onPress={() => setActiveTab("asset")}
          >
            <Text style={[styles.tabText, activeTab === "asset" && styles.activeTabText]}>
              💰 수입/자산
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "expense" && styles.activeTab]}
            onPress={() => setActiveTab("expense")}
          >
            <Text style={[styles.tabText, activeTab === "expense" && styles.activeTabText]}>
              💸 고정 지출
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "asset" ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>자산 및 부채 등록</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, assetType === "asset" && styles.typeBtnAssetActive]}
                  onPress={() => setAssetType("asset")}
                >
                  <Text style={[styles.typeBtnText, assetType === "asset" && styles.typeBtnActiveText]}>
                    자산 (수입)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, assetType === "liability" && styles.typeBtnLiabilityActive]}
                  onPress={() => setAssetType("liability")}
                >
                  <Text style={[styles.typeBtnText, assetType === "liability" && styles.typeBtnActiveText]}>
                    부채 (대출)
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                placeholder="항목 이름 (예: 주거래 은행, 전세 대출)"
                value={assetName}
                onChangeText={setAssetName}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                placeholder="금액 (예: 1,000,000)"
                keyboardType="numeric"
                value={assetAmount}
                onChangeText={setAssetAmount}
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  assetType === "liability" && { backgroundColor: colors.liabilityRed },
                ]}
                onPress={handleAddAsset}
              >
                <Text style={styles.buttonText}>
                  + {assetType === "asset" ? "자산" : "부채"} 추가
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                보유 자산/부채 목록 ({assets.length})
              </Text>
            </View>
            {assets.length > 0 ? (
              <View style={styles.listCard}>
                {assets.map((asset) => (
                  <View key={asset.id} style={styles.listItem}>
                    <View style={[
                      styles.typeBadge,
                      asset.type === "liability" ? styles.typeBadgeLiability : styles.typeBadgeAsset,
                    ]}>
                      <Ionicons
                        name={asset.type === "liability" ? "trending-down" : "trending-up"}
                        size={14}
                        color={asset.type === "liability" ? colors.liabilityRed : colors.assetBlue}
                      />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{asset.name}</Text>
                      <Text style={[
                        styles.listItemAmount,
                        asset.type === "liability" && { color: colors.liabilityRed },
                      ]}>
                        {asset.type === "liability" ? "- " : "+ "}₩{asset.amount.toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteAsset(asset.id, asset.name)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>등록된 자산이 없습니다.</Text>
                <Text style={styles.emptySubtext}>위 폼에서 자산 또는 부채를 추가해 보세요.</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>지출 등록</Text>
            </View>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                placeholder="지출 항목 (예: 넷플릭스)"
                value={expenseName}
                onChangeText={setExpenseName}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                placeholder="금액 (예: 13,500)"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />
              <View style={styles.freqRow}>
                {[
                  { label: "매일", value: "daily" },
                  { label: "매주", value: "weekly" },
                  { label: "매월", value: "monthly" },
                  { label: "매년", value: "yearly" },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      styles.freqBtn,
                      expenseFreq === f.value && styles.freqBtnActive,
                    ]}
                    onPress={() =>
                      setExpenseFreq(f.value as Expense["frequency"])
                    }
                  >
                    <Text style={[
                      styles.freqText,
                      expenseFreq === f.value && styles.freqTextActive,
                    ]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.danger }]}
                onPress={handleAddExpense}
              >
                <Text style={styles.buttonText}>+ 지출 추가</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                지출 내역 목록 ({expenses.length})
              </Text>
            </View>
            {expenses.length > 0 ? (
              <View style={styles.listCard}>
                {expenses.map((expense) => (
                  <View key={expense.id} style={styles.listItem}>
                    <View style={[styles.typeBadge, styles.typeBadgeExpense]}>
                      <Ionicons name="receipt-outline" size={14} color={colors.danger} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{expense.name}</Text>
                      <Text style={styles.listItemFreqSub}>
                        {expense.frequency === "daily"
                          ? "매일"
                          : expense.frequency === "weekly"
                            ? "매주"
                            : expense.frequency === "monthly"
                              ? "매월"
                              : "매년"}{" "}
                        · ₩{expense.amount.toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteExpense(expense.id, expense.name)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="card-outline" size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>등록된 지출 내역이 없습니다.</Text>
                <Text style={styles.emptySubtext}>고정 지출 항목을 추가해 번 레이트를 계산해 보세요.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    headerContainer: { paddingHorizontal: 24, paddingTop: 20 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 100 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    header: { fontSize: 28, fontWeight: "bold", color: c.text },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    dummyBtn: {
      backgroundColor: c.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    dummyBtnText: { color: c.textSecondary, fontSize: 11, fontWeight: "600" },

    tabContainer: {
      flexDirection: "row",
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 10,
    },
    activeTab: {
      backgroundColor: c.accentBg,
      borderWidth: 1,
      borderColor: c.accentBorder,
    },
    tabText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
    activeTabText: { color: c.accent },

    sectionHeader: { marginBottom: 12, marginTop: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    card: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: 10,
    },
    input: {
      backgroundColor: c.input,
      borderRadius: 12,
      padding: 16,
      color: c.text,
      fontSize: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    button: {
      backgroundColor: c.accent,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 4,
    },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

    typeRow: {
      flexDirection: "row",
      marginBottom: 16,
      backgroundColor: c.input,
      borderRadius: 10,
      padding: 4,
    },
    typeBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
    typeBtnAssetActive: { backgroundColor: c.assetBlueBg },
    typeBtnLiabilityActive: { backgroundColor: c.liabilityRedBg },
    typeBtnText: { color: c.textMuted, fontSize: 13, fontWeight: "600" },
    typeBtnActiveText: { color: c.text },

    freqRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    freqBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 10,
      marginHorizontal: 3,
      backgroundColor: c.input,
    },
    freqBtnActive: {
      backgroundColor: c.accentBg,
      borderColor: c.accentBorder,
    },
    freqText: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    freqTextActive: { color: c.accent, fontWeight: "700" },

    listCard: {
      backgroundColor: c.card,
      borderRadius: 20,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: 20,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.separator,
      gap: 12,
    },
    typeBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    typeBadgeAsset: { backgroundColor: c.assetBlueBg },
    typeBadgeLiability: { backgroundColor: c.liabilityRedBg },
    typeBadgeExpense: { backgroundColor: c.expenseBg },
    listItemInfo: { flex: 1 },
    listItemName: {
      color: c.text,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 3,
    },
    listItemAmount: { color: c.assetBlue, fontSize: 14, fontWeight: "700" },
    listItemFreqSub: { color: c.textMuted, fontSize: 12 },
    deleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: c.dangerBg,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyCard: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 20,
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    emptyText: { color: c.textSecondary, fontSize: 14, fontWeight: "600" },
    emptySubtext: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 4,
      textAlign: "center",
      lineHeight: 18,
    },
  });
}
