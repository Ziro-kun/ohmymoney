import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { AppText } from "../../src/components/AppText";
import { formatNumber } from "../../src/utils/format";
import { AssetWizardModal } from "../../src/components/AssetWizardModal";
import { LoanWizardModal } from "../../src/components/LoanWizardModal";
import { DebtManageWizardModal } from "../../src/components/DebtManageWizardModal";

export default function StockScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { assets, netWorth, loadData, addAsset, updateAsset, deleteAsset } =
    useFinanceStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [loanWizardVisible, setLoanWizardVisible] = useState(false);
  const [debtManageVisible, setDebtManageVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"asset" | "liability">("asset");
  const [depreciationRate, setDepreciationRate] = useState("");

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
    setDepreciationRate("");
    setModalVisible(true);
  };

  const openWizardModal = () => {
    setWizardVisible(true);
  };

  const openLoanWizardModal = () => {
    setLoanWizardVisible(true);
  };

  const openDebtManageModal = () => {
    setDebtManageVisible(true);
  };

  const openEditModal = (asset: any) => {
    setEditingAsset(asset);
    setName(asset.name);
    // Use seedAmount (original DB value) if available, otherwise fallback to amount
    setAmount(formatNumber(asset.seedAmount ?? asset.amount, 0));
    setType(asset.type);
    setDepreciationRate(asset.depreciationRate != null ? String(asset.depreciationRate) : "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !amount) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    const numRate = depreciationRate ? parseFloat(depreciationRate) : editingAsset?.depreciationRate;
    if (editingAsset) {
      await updateAsset(editingAsset.id, name, numAmount, type, editingAsset.assetCategory, numRate);
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
          자산관리
        </AppText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.wizardActionsRow}>
        <TouchableOpacity
          style={[styles.wizardBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}
          onPress={openDebtManageModal}
        >
          <Ionicons name="cash-outline" size={15} color={colors.textSecondary} />
          <AppText style={[styles.wizardBtnText, { color: colors.textSecondary }]}>부채관리</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.wizardBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}
          onPress={openLoanWizardModal}
        >
          <Ionicons name="card-outline" size={15} color={colors.textSecondary} />
          <AppText style={[styles.wizardBtnText, { color: colors.textSecondary }]}>대출등록</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.wizardBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}
          onPress={openWizardModal}
        >
          <Ionicons name="layers-outline" size={15} color={colors.textSecondary} />
          <AppText style={[styles.wizardBtnText, { color: colors.textSecondary }]}>자산등록</AppText>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <AppText style={[styles.assetType, { color: colors.textMuted }]}>
                  {item.assetCategory === "loan" ? "대출" :
                   item.assetCategory === "vehicle" ? "차량" :
                   item.assetCategory === "real_estate" ? "부동산" :
                   item.assetCategory === "stock" ? "주식/투자" :
                   item.type === "asset" ? "자산" : "부채"}
                </AppText>
                {item.depreciationRate != null && item.depreciationRate > 0 && (
                  <AppText style={[styles.assetType, { color: colors.textMuted }]}>
                    • 연 {item.depreciationRate}%
                  </AppText>
                )}
              </View>
            </View>
            <AppText
              style={[
                styles.assetAmount,
                {
                  color: (item.type === "asset" ? item.amount >= 0 : item.amount <= 0) ? colors.accent : colors.danger,
                },
              ]}
            >
              {item.type === "liability" ? (item.amount > 0 ? "-" : "+") : (item.amount < 0 ? "-" : "")}
              {formatNumber(Math.abs(item.amount), 0)}원
            </AppText>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[
            styles.modalOverlay,
            { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)" }
          ]}>
          <TouchableWithoutFeedback>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#0d1a30" : "#ffffff",
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
                  type === "asset"
                    ? { backgroundColor: colors.accent, borderColor: colors.accent }
                    : { borderColor: colors.cardBorder },
                ]}
                onPress={() => setType("asset")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    { color: type === "asset" ? "#FFF" : colors.textMuted },
                  ]}
                >
                  자산
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "liability"
                    ? { backgroundColor: colors.danger, borderColor: colors.danger }
                    : { borderColor: colors.cardBorder },
                ]}
                onPress={() => setType("liability")}
              >
                <AppText
                  style={[
                    styles.typeBtnText,
                    { color: type === "liability" ? "#FFF" : colors.textMuted },
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

            {editingAsset && (editingAsset.assetCategory === "loan" || editingAsset.assetCategory === "vehicle") && (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.input,
                  },
                ]}
                placeholder={editingAsset.assetCategory === "loan" ? "연이자율 (%) 예: 4.5" : "연감가율 (%) 예: 10"}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={depreciationRate}
                onChangeText={setDepreciationRate}
              />
            )}

            {/* Depreciation status for vehicle assets */}
            {editingAsset?.assetCategory === "vehicle" && editingAsset.depreciationRate > 0 && editingAsset.createdAt && (
              (() => {
                const seedValue = editingAsset.seedAmount ?? 0;
                const currentValue = editingAsset.amount ?? 0;
                const depreciated = seedValue - currentValue;
                const pctLost = seedValue > 0 ? Math.round((depreciated / seedValue) * 100) : 0;
                const createdDate = new Date(editingAsset.createdAt.includes(" ") ? editingAsset.createdAt.replace(" ", "T") + "Z" : editingAsset.createdAt);
                const daysPassed = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                const yearsPassed = (daysPassed / 365).toFixed(1);
                return (
                  <View style={[styles.deprStatus, { backgroundColor: isDark ? "#0d1a30" : "#f8f9fb" }]}>
                    <AppText style={[styles.deprStatusTitle, { color: colors.textMuted }]}>📉 감가상각 현황</AppText>
                    <View style={styles.deprStatusRow}>
                      <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>원래 구매가</AppText>
                      <AppText style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>₩{formatNumber(seedValue, 0)}</AppText>
                    </View>
                    <View style={styles.deprStatusRow}>
                      <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>현재 가치</AppText>
                      <AppText style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>₩{formatNumber(currentValue, 0)}</AppText>
                    </View>
                    <View style={styles.deprStatusRow}>
                      <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>감가된 금액</AppText>
                      <AppText style={{ color: colors.danger, fontSize: 13, fontWeight: "700" }}>-₩{formatNumber(depreciated, 0)} (-{pctLost}%)</AppText>
                    </View>
                    <View style={styles.deprStatusRow}>
                      <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>경과 기간</AppText>
                      <AppText style={{ color: colors.textMuted, fontSize: 13 }}>{yearsPassed}년 ({daysPassed}일)</AppText>
                    </View>
                  </View>
                );
              })()
            )}

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
          </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <AssetWizardModal 
        visible={wizardVisible} 
        onClose={() => setWizardVisible(false)} 
      />

      <LoanWizardModal
        visible={loanWizardVisible}
        onClose={() => setLoanWizardVisible(false)}
      />

      <DebtManageWizardModal
        visible={debtManageVisible}
        onClose={() => setDebtManageVisible(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: isDark ? "#121e33" : "#f1f5f9",
    borderWidth: 0,
  },
  netWorthLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  netWorthValue: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 10,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  assetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    backgroundColor: isDark ? "#121e33" : "#f8fafc",
    borderWidth: 0,
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
  modalContent: {
    borderRadius: 32,
    padding: 28,
    paddingBottom: 60,
    backgroundColor: isDark ? "#0d1a30" : "#ffffff",
    borderWidth: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  wizardActionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  wizardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  wizardBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeSelector: { flexDirection: "row", marginBottom: 20, gap: 12 },
  typeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  typeBtnText: { fontWeight: "700", fontSize: 15 },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: isDark ? "#050a14" : "#f1f5f9",
    borderWidth: 0,
  },
  deprStatus: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  deprStatusTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  deprStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  modalActions: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  deleteBtn: { paddingVertical: 10, paddingHorizontal: 5 },
  cancelBtn: { padding: 10, marginRight: 8 },
  saveBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
});
