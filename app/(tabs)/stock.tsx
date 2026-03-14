import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { AppText } from "../../src/components/AppText";
import { formatNumber } from "../../src/utils/format";

export default function StockScreen() {
  const { colors, isDark } = useAppTheme();
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
    setAmount(formatNumber(asset.amount, 0));
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
        <AppText style={[styles.title, { color: colors.text }]}>
          자산관리 (Stock)
        </AppText>
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
        <AppText style={[styles.netWorthLabel, { color: colors.textMuted }]}>
          현재 순자산
        </AppText>
        <AppText style={[styles.netWorthValue, { color: colors.text }]}>
          ₩{formatNumber(netWorth, 0)}
        </AppText>
      </View>

      <AppText style={[styles.sectionTitle, { color: colors.textMuted }]}>
        보유 자산 및 부채
      </AppText>
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
              <AppText style={[styles.assetName, { color: colors.text }]}>
                {item.name}
              </AppText>
              <AppText style={[styles.assetType, { color: colors.textMuted }]}>
                {item.type === "asset" ? "자산/투자" : "부채/대출"}
              </AppText>
            </View>
            <AppText
              style={[
                styles.assetAmount,
                {
                  color: item.type === "asset" ? colors.accent : colors.danger,
                },
              ]}
            >
              {item.type === "liability" ? "-" : ""}
              {formatNumber(item.amount, 0)}원
            </AppText>
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
              {editingAsset ? "자산 수정" : "자산 추가"}
            </AppText>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "asset" && { backgroundColor: colors.accent },
                ]}
                onPress={() => setType("asset")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    type === "asset" && { color: "#FFF" },
                  ]}
                >
                  자산
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "liability" && { backgroundColor: colors.danger },
                ]}
                onPress={() => setType("liability")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    type === "liability" && { color: "#FFF" },
                  ]}
                >
                  부채
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
              value={formatNumber(amount, 0)}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, "");
                setAmount(numericValue);
              }}
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
                  <AppText style={{ color: colors.danger }}>삭제</AppText>
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
  modalActions: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  deleteBtn: { paddingVertical: 10, paddingHorizontal: 5 },
  cancelBtn: { padding: 10, marginRight: 8 },
  saveBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
});
