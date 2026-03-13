import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { formatNumber } from "../../src/utils/format";

export default function FlowScreen() {
  const { colors } = useAppTheme();
  const { transactions, loadData, addTransaction, deleteTransaction } = useFinanceStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isFixed, setIsFixed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    if (!amount || !description) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    await addTransaction(description, numAmount, type, isFixed);
    setModalVisible(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setIsFixed(false);
    setType("expense");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>가계부 (Flow)</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...transactions].reverse()}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.txInfo}>
              <Text style={[styles.txDescription, { color: colors.text }]}>{item.description}</Text>
              <Text style={[styles.txDate, { color: colors.textMuted }]}>
                {item.date} • {item.category || '미분류'}
              </Text>
            </View>
            <View style={styles.txAmountWrapper}>
              {item.isFixed && (
                <Ionicons name="repeat" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              )}
              <Text style={[
                styles.txAmount,
                { color: item.type === "expense" ? colors.danger : colors.accent }
              ]}>
                {item.type === "expense" ? "-" : "+"}
                {formatNumber(item.amount)}원
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>거래 추가</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === "expense" && { backgroundColor: colors.danger }]}
                onPress={() => setType("expense")}
              >
                <Text style={[styles.typeBtnText, type === "expense" && { color: "#FFF" }]}>지출</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === "income" && { backgroundColor: colors.accent }]}
                onPress={() => setType("income")}
              >
                <Text style={[styles.typeBtnText, type === "income" && { color: "#FFF" }]}>수입</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
              placeholder="내역"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
              placeholder="금액"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={formatNumber(amount)}
              onChangeText={(text) => setAmount(formatNumber(text))}
            />

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsFixed(!isFixed)}
            >
              <Ionicons
                name={isFixed ? "checkbox" : "square-outline"}
                size={24}
                color={isFixed ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>고정 지출 여부</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: colors.textMuted }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>저장</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "800" },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  list: { padding: 20 },
  transactionItem: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  txInfo: { flex: 1 },
  txDescription: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmountWrapper: { flexDirection: "row", alignItems: "center" },
  txAmount: { fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalContent: { borderRadius: 24, padding: 24, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  typeSelector: { flexDirection: "row", marginBottom: 16, gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: "#ccc" },
  typeBtnText: { fontWeight: "600" },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, marginBottom: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  toggleLabel: { fontSize: 14, fontWeight: "500" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  cancelBtn: { padding: 10 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
展开
