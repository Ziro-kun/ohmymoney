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

export default function StockScreen() {
  const { colors } = useAppTheme();
  const { assets, netWorth, loadData, addAsset, updateAsset, deleteAsset } =
    useFinanceStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"asset" | "liability">("asset");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const openAddModal = () => {
    setEditingAsset(null);
    setName("");
    setAmount("");
    setType("asset");
    setModalVisible(true);
  };

  const openEditModal = (asset: any) => {
    setEditingAsset(asset);
    setName(asset.name);
    setAmount(formatNumber(asset.amount));
    setType(asset.type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !amount) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    if (editingAsset) {
      await updateAsset(editingAsset.id, name, numAmount, type);
    } else {
      await addAsset(name, numAmount, type);
    }
    setModalVisible(false);
    loadData();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          자산관리 (Stock)
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.netWorthCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.netWorthLabel, { color: colors.textMuted }]}>
          현재 순자산
        </Text>
        <Text style={[styles.netWorthValue, { color: colors.text }]}>
          ₩{formatNumber(netWorth)}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        보유 자산 및 부채
      </Text>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.assetItem,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => openEditModal(item)}
          >
            <View style={styles.assetInfo}>
              <Text style={[styles.assetName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.assetType, { color: colors.textMuted }]}>
                {item.type === "asset" ? "자산/투자" : "부채/대출"}
              </Text>
            </View>
            <Text
              style={[
                styles.assetAmount,
                {
                  color: item.type === "asset" ? colors.accent : colors.danger,
                },
              ]}
            >
              {item.type === "liability" ? "-" : ""}
              {formatNumber(item.amount)}원
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingAsset ? "자산 수정" : "자산 추가"}
            </Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "asset" && { backgroundColor: colors.accent },
                ]}
                onPress={() => setType("asset")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "asset" && { color: "#FFF" },
                  ]}
                >
                  자산
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "liability" && { backgroundColor: colors.danger },
                ]}
                onPress={() => setType("liability")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "liability" && { color: "#FFF" },
                  ]}
                >
                  부채
                </Text>
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
              placeholder="자산명 (예: 주거래 은행)"
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
              placeholder="금액 (원)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={formatNumber(amount)}
              onChangeText={(text) => setAmount(formatNumber(text))}
            />

            <View style={styles.modalActions}>
              {editingAsset && (
                <TouchableOpacity
                  onPress={async () => {
                    await deleteAsset(editingAsset.id);
                    setModalVisible(false);
                    loadData();
                  }}
                  style={styles.deleteBtn}
                >
                  <Text style={{ color: colors.danger }}>삭제</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: colors.textMuted }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              >
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
  netWorthCard: {
    margin: 20,
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  netWorthLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  netWorthValue: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  assetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  assetType: { fontSize: 12 },
  assetAmount: { fontSize: 18, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { borderRadius: 24, padding: 24, borderWidth: 1 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  typeSelector: { flexDirection: "row", marginBottom: 16, gap: 10 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  typeBtnText: { fontWeight: "600" },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalActions: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  deleteBtn: { padding: 10 },
  cancelBtn: { padding: 10, marginRight: 10 },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
