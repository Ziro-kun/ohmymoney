import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore, Transaction, Asset } from "../../src/store/useFinanceStore";
import { AppText } from "../../src/components/AppText";
import { formatNumber } from "../../src/utils/format";
import { CATEGORY_CATALOG, CategoryGroup, TransactionType } from "../../src/constants/categories";

LocaleConfig.locales["ko"] = {
  monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘"
};
LocaleConfig.defaultLocale = "ko";

// DEPRECATED: Using CATEGORY_CATALOG from constants/categories.ts instead
const OLD_CATEGORIES_DO_NOT_USE = [];

export default function FlowScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { 
    transactions, 
    assets,
    loadData, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useFinanceStore();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form States
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState("기타");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<number | undefined>(undefined);
  const [toAssetId, setToAssetId] = useState<number | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredTransactions = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedDate]);

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense, profit: income - expense };
  }, [filteredTransactions]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (tx: Transaction) => {
    if (tx.isVirtual) {
      // Find the original (non-virtual, isFixed) transaction by matching description
      const originalDescription = tx.description.endsWith(" (정기)")
        ? tx.description.slice(0, -5)
        : tx.description;
      const original = transactions.find(
        t => !t.isVirtual && t.isFixed && t.description === originalDescription && t.amount === tx.amount
      );
      if (original) {
        Alert.alert(
          "정기 내역",
          "자동 생성된 정기 내역입니다. 원본 내역을 수정하시겠습니까?",
          [
            { text: "취소", style: "cancel" },
            { text: "원본 수정", onPress: () => openEditModal(original) },
          ]
        );
      } else {
        Alert.alert("정기 내역", "자동 생성된 내역은 직접 수정할 수 없습니다. 원본 내역을 찾을 수 없습니다.");
      }
      return;
    }
    setEditingTransaction(tx);
    setDescription(tx.description);
    setAmount(tx.amount.toString());
    setIsFixed(!!tx.isFixed);
    setType(tx.type);
    setDate(tx.date);
    setCategory(tx.category || "기타");
    setAssetId(tx.assetId);
    setToAssetId(tx.toAssetId);
    setModalVisible(true);
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!amount || !description) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    const numRecurringDay = isFixed ? parseInt(date.split("-")[2], 10) : null;

    if (editingTransaction) {
      await updateTransaction(
        editingTransaction.id,
        description,
        numAmount,
        type,
        isFixed,
        date,
        category,
        assetId,
        toAssetId,
        numRecurringDay
      );
    } else {
      await addTransaction(
        description,
        numAmount,
        type,
        isFixed,
        date,
        category,
        assetId,
        toAssetId,
        numRecurringDay
      );
    }

    setModalVisible(false);
    resetForm();
  };
  const resetForm = () => {
    setDescription("");
    setAmount("");
    setIsFixed(false);
    setType("expense");
    setDate(new Date().toISOString().split("T")[0]);
    setShowDatePicker(false);
    setCategory("기타");
    setAssetId(assets.length > 0 ? assets[0].id : undefined);
    setToAssetId(undefined);
    setEditingTransaction(null);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      await deleteTransaction(editingTransaction.id);
      setModalVisible(false);
      resetForm();
    }
  };

  const getCategoryIcon = (catLabel: string) => {
    // Find icon from catalog based on label match
    for (const type of ['expense', 'income', 'transfer'] as TransactionType[]) {
      const group = CATEGORY_CATALOG[type].find(g => 
        g.label === catLabel || g.subCategories.some(s => s.label === catLabel)
      );
      if (group) return group.icon as any;
    }
    return "ellipsis-horizontal";
  };

  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarExpanded(!calendarExpanded);
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    transactions.forEach(tx => {
      if (!marks[tx.date]) {
        marks[tx.date] = { dots: [] };
      }
      const color = tx.type === "expense" ? colors.danger : tx.type === "income" ? colors.accent : colors.text;
      if (!marks[tx.date].dots.find((d: any) => d.color === color)) {
        marks[tx.date].dots.push({ key: `${tx.type}-${color}`, color });
      }
    });

    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    if (!marks[selectedDateStr]) {
      marks[selectedDateStr] = {};
    }
    marks[selectedDateStr].selected = true;
    marks[selectedDateStr].selectedColor = colors.cardBorder;
    
    return marks;
  }, [transactions, selectedDate, colors]);

  const onDayPress = (day: any) => {
    const newDate = new Date(day.timestamp);
    // Since React Native Calendars timestamp is UTC based, we can create the local date string to avoid timezone offset issues
    const localDate = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(localDate);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Month Selector */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCalendar} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AppText style={[styles.title, { color: colors.text }]}>
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </AppText>
          <Ionicons 
            name="calendar" 
            size={20} 
            color={calendarExpanded ? colors.text : colors.textMuted} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {calendarExpanded && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Calendar
            key={isDark ? "dark-calendar-main" : "light-calendar-main"}
            current={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`}
            onDayPress={onDayPress}
            onMonthChange={(month: any) => {
              const localDate = new Date(month.year, month.month - 1, 1);
              setSelectedDate(localDate);
            }}
            markingType={'multi-dot'}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.bg,
              calendarBackground: colors.bg,
              textSectionTitleColor: colors.textMuted,
              selectedDayBackgroundColor: colors.cardBorder,
              selectedDayTextColor: colors.text,
              todayTextColor: colors.accent,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.accent,
              selectedDotColor: colors.accent,
              arrowColor: colors.text,
              monthTextColor: colors.text,
              indicatorColor: colors.accent,
            }}
          />
        </View>
      )}

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.textMuted }]}>수입</AppText>
          <AppText style={[styles.summaryValue, { color: colors.accent }]}>
            ₩{formatNumber(monthSummary.income, 0)}
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.textMuted }]}>지출</AppText>
          <AppText style={[styles.summaryValue, { color: colors.danger }]}>
            ₩{formatNumber(monthSummary.expense, 0)}
          </AppText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryLabel, { color: colors.textMuted }]}>순이익</AppText>
          <AppText style={[styles.summaryValue, { color: colors.text }]}>
            ₩{formatNumber(monthSummary.profit, 0)}
          </AppText>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.transactionItem,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => openEditModal(item)}
          >
            <View style={styles.txIconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.bgSecondary }]}>
                <Ionicons name={getCategoryIcon(item.category || "기타")} size={20} color={colors.textSecondary} />
              </View>
            </View>
            <View style={styles.txInfo}>
              <AppText style={[styles.txDescription, { color: colors.text }]}>
                {item.description}
              </AppText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AppText style={[styles.txDate, { color: colors.textMuted }]}>
                  {item.date} • {item.category || "미분류"}
                </AppText>
                {item.isFixed && (
                  <View style={[styles.fixedBadge, { backgroundColor: colors.accentBg }]}>
                    <AppText style={[styles.fixedBadgeText, { color: colors.accent }]}>고정</AppText>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.txAmountWrapper}>
              <AppText
                style={[
                  styles.txAmount,
                  {
                    color:
                      item.type === "expense" ? colors.danger : 
                      item.type === "income" ? colors.accent : colors.textMuted,
                  },
                ]}
              >
                {item.type === "expense" ? "-" : item.type === "income" ? "+" : ""}
                {formatNumber(item.amount, 0)}원
              </AppText>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppText style={{ color: colors.textMuted }}>내역이 없습니다.</AppText>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#0d1a30" : "#ffffff",
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <AppText style={[styles.modalTitle, { color: colors.text }]}>
              {editingTransaction ? "내역 수정" : "거래 추가"}
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeBtn,
                      type === t && { 
                        backgroundColor: t === "expense" ? colors.danger : t === "income" ? colors.accent : colors.textSecondary,
                        borderColor: t === "expense" ? colors.danger : t === "income" ? colors.accent : colors.textSecondary 
                      },
                      type !== t && { borderColor: colors.cardBorder }
                    ]}
                    onPress={() => setType(t)}
                  >
                    <AppText
                      style={[
                        styles.typeBtnText,
                        { color: type === t ? "#FFF" : colors.textMuted }
                      ]}
                    >
                      {t === "expense" ? "지출" : t === "income" ? "수입" : "이체"}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.input,
                    fontSize: 24,
                    textAlign: "center",
                    fontWeight: "800",
                    height: 70
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={formatNumber(amount, 0)}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setAmount(numericValue);
                }}
              />

              {/* Description Input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.input,
                  },
                ]}
                placeholder="어디에 쓰셨나요?"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              {/* Asset Picker (Payment Method) */}
              <AppText style={[styles.sectionLabel, { color: colors.textMuted }]}>결제 수단 / 자산</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                {assets.map(asset => (
                  <TouchableOpacity
                    key={asset.id}
                    style={[
                      styles.assetBtn,
                      assetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                      assetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                    ]}
                    onPress={() => setAssetId(asset.id)}
                  >
                    <AppText style={{ color: assetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {type === "transfer" && (
                <>
                  <AppText style={[styles.sectionLabel, { color: colors.textMuted }]}>받는 자산</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                    {assets.map(asset => (
                      <TouchableOpacity
                        key={asset.id}
                        style={[
                          styles.assetBtn,
                          toAssetId === asset.id && { backgroundColor: colors.textSecondary, borderColor: colors.textSecondary },
                          toAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                        ]}
                        onPress={() => setToAssetId(asset.id)}
                      >
                        <AppText style={{ color: toAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Hierarchical Category Picker: Two-Step Selection */}
              <View style={{ marginBottom: 24 }}>
                <AppText style={[styles.sectionLabel, { color: colors.textMuted }]}>분류 선택</AppText>
                
                {/* 1st Step: Group Selection (Horizontal Scroll Tags) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                  {CATEGORY_CATALOG[type].map(group => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupTag,
                        selectedGroupId === group.id && { backgroundColor: type === 'expense' ? colors.danger : colors.accent, borderColor: 'transparent' },
                        selectedGroupId !== group.id && { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }
                      ]}
                      onPress={() => {
                        setSelectedGroupId(group.id);
                        // Auto-select first sub-category if not already in this group
                        if (group.subCategories.length > 0) {
                          setCategory(group.subCategories[0].label);
                        } else {
                          setCategory(group.label);
                        }
                      }}
                    >
                      <Ionicons name={group.icon as any} size={14} color={selectedGroupId === group.id ? "#FFF" : colors.textSecondary} />
                      <AppText style={[styles.groupTagText, { color: selectedGroupId === group.id ? "#FFF" : colors.text }]}>{group.label}</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 2nd Step: Sub-Category Selection (Grid of compact tags) */}
                {selectedGroupId && (
                  <View style={styles.subCategoryRow}>
                    {CATEGORY_CATALOG[type].find(g => g.id === selectedGroupId)?.subCategories.map(sub => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.subTag,
                          category === sub.label && { backgroundColor: isDark ? colors.accentBg : '#E8EEFF', borderColor: colors.accent },
                          category !== sub.label && { borderColor: colors.cardBorder, backgroundColor: 'transparent' }
                        ]}
                        onPress={() => setCategory(sub.label)}
                      >
                        <AppText style={[styles.subTagText, { color: category === sub.label ? colors.accent : colors.textMuted }]}>
                          {sub.label}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date Input */}
              <AppText style={[styles.sectionLabel, { color: colors.textMuted }]}>날짜</AppText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(!showDatePicker)}
                style={[
                  styles.input,
                  {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.input,
                    justifyContent: "center",
                  },
                ]}
              >
                <AppText style={{ color: colors.text }}>{date}</AppText>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Calendar
                    key={isDark ? "dark-calendar-modal" : "light-calendar-modal"}
                    current={date}
                    onDayPress={(day: any) => {
                      setDate(day.dateString);
                      setShowDatePicker(false);
                    }}
                    theme={{
                      backgroundColor: colors.input,
                      calendarBackground: colors.input,
                      textSectionTitleColor: colors.textMuted,
                      selectedDayBackgroundColor: colors.accent,
                      selectedDayTextColor: "#ffffff",
                      todayTextColor: colors.accent,
                      dayTextColor: colors.text,
                      textDisabledColor: colors.textMuted,
                      dotColor: colors.accent,
                      selectedDotColor: "#ffffff",
                      arrowColor: colors.text,
                      monthTextColor: colors.text,
                      indicatorColor: colors.accent,
                    }}
                    markedDates={{
                      [date]: { selected: true, selectedColor: colors.accent }
                    }}
                  />
                </View>
              )}

              <View style={[styles.toggleRow, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", marginTop: 15 }]}>
                <View>
                  <AppText style={[styles.toggleTitle, { color: colors.text }]}>고정 지출/수입 설정</AppText>
                  <AppText style={[styles.toggleSub, { color: colors.textMuted }]}>매달 발생하는 정기 내역</AppText>
                </View>
                <Switch
                  value={isFixed}
                  onValueChange={setIsFixed}
                  trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
                  thumbColor={"#fff"}
                />
              </View>

              {isFixed && (
                <View style={{ marginTop: 10, padding: 12, backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", borderRadius: 10 }}>
                  <AppText style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
                    지정한 날짜({parseInt(date.split("-")[2], 10)}일) 기준으로 매월 정기 반영됩니다. 날짜를 변경하시려면 위 달력에서 선택해주세요.
                  </AppText>
                </View>
              )}

              <View style={styles.modalActions}>
                {editingTransaction && (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <AppText style={{ color: colors.danger, fontWeight: "600" }}>삭제</AppText>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <AppText style={{ color: colors.textMuted }}>취소</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
                  <AppText style={{ color: "#FFF", fontWeight: "700" }}>저장</AppText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20
  },
  title: { fontSize: 20, fontWeight: "800" },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: isDark ? "#121e33" : "#f1f5f9",
    borderWidth: 0,
  },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 11, fontWeight: "600", color: "#888", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  summaryDivider: { width: 1, height: 30, backgroundColor: "#eee" },
  list: { padding: 20, paddingBottom: 100 },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: isDark ? "#121e33" : "#f8fafc",
    borderWidth: 0,
  },
  txIconContainer: { marginRight: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txDescription: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  txDate: { fontSize: 12 },
  fixedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  txAmountWrapper: { alignItems: "flex-end" },
  txAmount: { fontSize: 16, fontWeight: "800" },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  fab: {
    position: "absolute",
    right: 25,
    bottom: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 28,
    maxHeight: "90%",
    paddingBottom: 60,
    borderWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
  },
  typeSelector: { flexDirection: "row", marginBottom: 20, gap: 8 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  typeBtnText: { fontWeight: "700", fontSize: 14 },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDark ? "#050a14" : "#f1f5f9",
    borderWidth: 0,
  },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 10, marginTop: 4 },
  assetScroll: { marginBottom: 16 },
  assetBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12, 
    marginRight: 8,
    minWidth: 70,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  
  // Hierarchical Category Styles
  groupScroll: { marginBottom: 12 },
  groupTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1,
    gap: 6
  },
  groupTagText: { fontSize: 14, fontWeight: '700' },
  subCategoryRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    paddingTop: 4 
  },
  subTag: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1,
  },
  subTagText: { fontSize: 13, fontWeight: '600' },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    marginBottom: 30,
  },
  toggleTitle: { fontSize: 15, fontWeight: "700" },
  toggleSub: { fontSize: 12 },
  modalActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: { padding: 12 },
  cancelBtn: { padding: 12 },
  saveBtn: { flex: 1, padding: 16, borderRadius: 18, alignItems: "center" },
});
