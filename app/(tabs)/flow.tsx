import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { AppText } from "../../src/components/AppText";
import { formatNumber } from "../../src/utils/format";

export default function FlowScreen() {
  const { colors, isDark } = useAppTheme();
  const { transactions, loadData, addTransaction, updateTransaction, deleteTransaction } =
    useFinanceStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isFixed, setIsFixed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const openAddModal = () => {
    setEditingTransaction(null);
    setName("");
    setAmount("");
    setIsFixed(false);
    setType("expense");
    setModalVisible(true);
  };

  const openEditModal = (tx: any) => {
    setEditingTransaction(tx);
    setName(tx.name);
    setAmount(tx.amount.toString());
    setIsFixed(!!tx.isFixed);
    setType(tx.type === "income" ? "income" : "expense");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!amount || !name) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, name, numAmount, type, isFixed);
    } else {
      await addTransaction(name, numAmount, type, isFixed);
    }
    
    setModalVisible(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setName("");
    setAmount("");
    setIsFixed(false);
    setType("expense");
    setEditingTransaction(null);
  };

  const handleDelete = async () => {
    if (editingTransaction) {
      await deleteTransaction(editingTransaction.id);
      setModalVisible(false);
      resetForm();
      loadData();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: colors.text }]}>
          가계부 (Flow)
        </AppText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...transactions].reverse()}
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
            <View style={styles.txInfo}>
              <AppText style={[styles.txDescription, { color: colors.text }]}>
                {item.name}
              </AppText>
              <AppText style={[styles.txDate, { color: colors.textMuted }]}>
                {item.date} • {item.category || "미분류"}
              </AppText>
            </View>
            <View style={styles.txAmountWrapper}>
              {item.isFixed ? (
                <Ionicons
                  name="repeat"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
              ) : null}
              <AppText
                style={[
                  styles.txAmount,
                  {
                    color:
                      item.type === "expense" ? colors.danger : colors.accent,
                  },
                ]}
              >
                {item.type === "expense" ? "-" : "+"}
                {formatNumber(item.amount, 0)}원
              </AppText>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={[
          styles.modalOverlay,
          { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)" }
        ]}>
          <View
            style={[
              styles.modalContent,
              { 
                backgroundColor: isDark ? "#1a2235" : colors.card, 
                borderColor: colors.cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10
              },
            ]}
          >
            <AppText style={[styles.modalTitle, { color: colors.text }]}>
              {editingTransaction ? "내역 수정" : "거래 추가"}
            </AppText>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "expense" && { backgroundColor: colors.danger, borderColor: colors.danger },
                  type !== "expense" && { borderColor: colors.cardBorder }
                ]}
                onPress={() => setType("expense")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    { color: type === "expense" ? "#FFF" : colors.textMuted }
                  ]}
                >
                  지출
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "income" && { backgroundColor: colors.accent, borderColor: colors.accent },
                  type !== "income" && { borderColor: colors.cardBorder }
                ]}
                onPress={() => setType("income")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    { color: type === "income" ? "#FFF" : colors.textMuted }
                  ]}
                >
                  수입
                </AppText>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.input,
                },
              ]}
              placeholder="내역 (예: 점심 식사)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.input,
                },
              ]}
              placeholder="금액"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={formatNumber(amount, 0)}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, "");
                setAmount(numericValue);
              }}
            />

            <View style={[styles.toggleRow, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb" }]}>
              <View>
                <AppText style={[styles.toggleTitle, { color: colors.text }]}>
                  고정 지출/수입으로 설정
                </AppText>
                <AppText style={[styles.toggleSub, { color: colors.textMuted }]}>
                  매달 발생하는 정기적인 내역입니다
                </AppText>
              </View>
              <Switch
                value={isFixed}
                onValueChange={setIsFixed}
                trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
                thumbColor={"#fff"}
                ios_backgroundColor={isDark ? "#333" : "#ddd"}
              />
            </View>

            <View style={styles.modalActions}>
              {editingTransaction && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteBtn}
                >
                  <AppText style={{ color: colors.danger, fontWeight: "600" }}>삭제</AppText>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <AppText style={{ color: colors.textMuted }}>취소</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              >
                <AppText style={{ color: "#FFF", fontWeight: "700" }}>저장</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "800" },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { padding: 20 },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  txInfo: { flex: 1 },
  txDescription: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmountWrapper: { flexDirection: "row", alignItems: "center" },
  txAmount: { fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { borderRadius: 32, padding: 28, borderWidth: 1 },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  typeSelector: { flexDirection: "row", marginBottom: 20, gap: 12 },
  typeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  typeBtnText: { fontWeight: "700", fontSize: 15 },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalActions: { flexDirection: "row", alignItems: "center" },
  deleteBtn: { paddingVertical: 10, paddingHorizontal: 5 },
  cancelBtn: { padding: 10, marginRight: 8 },
  saveBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
});
