import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../store/useFinanceStore";
import { AppText } from "./AppText";
import { formatNumber } from "../utils/format";

interface DebtManageWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DebtManageWizardModal({ visible, onClose }: DebtManageWizardModalProps) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { assets, repayLoan, refinanceLoan } = useFinanceStore();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"repay" | "refinance" | null>(null);

  // Data
  const loans = assets.filter(a => a.type === "liability" && a.amount > 0);
  const cashAccounts = assets.filter(a => a.type === "asset");

  // Selection
  const [selectedLoanId, setSelectedLoanId] = useState<number | undefined>(
    loans.length > 0 ? loans[0].id : undefined
  );
  const [sourceAccountId, setSourceAccountId] = useState<number | undefined>(
    cashAccounts.length > 0 ? cashAccounts[0].id : undefined
  );

  // Repay State
  const [repayAmount, setRepayAmount] = useState("");
  const [penaltyPercent, setPenaltyPercent] = useState("2.0");

  // Refinance State
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");
  const [newMonthlyPayment, setNewMonthlyPayment] = useState("");

  const resetAndClose = () => {
    setStep(1);
    setMode(null);
    setRepayAmount("");
    setNewLoanName("");
    setNewLoanAmount("");
    onClose();
  };

  const parseNum = (val: string) => parseInt(val.replace(/,/g, "") || "0", 10);

  const handleSubmit = async () => {
    if (!selectedLoanId) return;

    if (mode === "repay") {
      if (!sourceAccountId) return;
      const amount = parseNum(repayAmount);
      const penalty = Math.round(amount * (parseFloat(penaltyPercent) / 100));
      await repayLoan(selectedLoanId, amount, sourceAccountId, penalty);
    } else if (mode === "refinance") {
      if (!sourceAccountId) return;
      await refinanceLoan(
        selectedLoanId,
        newLoanName,
        parseNum(newLoanAmount),
        sourceAccountId,
        parseNum(newMonthlyPayment)
      );
    }
    resetAndClose();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={[styles.stepDot, { backgroundColor: s === step ? colors.accent : colors.cardBorder }]} />
      ))}
    </View>
  );

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? "#0d1a30" : "#ffffff", borderColor: colors.cardBorder }]}>
          <View style={styles.headerRow}>
            <AppText style={[styles.modalTitle, { color: colors.text }]}>부채 관리 마법사</AppText>
            <TouchableOpacity onPress={resetAndClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {renderStepIndicator()}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>1. 관리할 대출 선택</AppText>
                <AppText style={[styles.desc, { color: colors.textMuted }]}>상환하거나 갈아탈 대출을 선택해주세요.</AppText>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                  {loans.map(loan => (
                    <TouchableOpacity
                      key={loan.id}
                      style={[
                        styles.assetBtn,
                        selectedLoanId === loan.id
                          ? { backgroundColor: colors.danger, borderColor: colors.danger }
                          : { backgroundColor: isDark ? "#1a2235" : "#f1f5f9" },
                      ]}
                      onPress={() => setSelectedLoanId(loan.id)}
                    >
                      <AppText style={{ color: selectedLoanId === loan.id ? "#FFF" : colors.text, fontWeight: "600" }}>{loan.name}</AppText>
                      <AppText style={{ color: selectedLoanId === loan.id ? "#FFF" : colors.textMuted, fontSize: 12 }}>₩{formatNumber(loan.amount, 0)}</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      mode === 'repay'
                        ? { borderColor: colors.accent, backgroundColor: colors.accentBg }
                        : { backgroundColor: isDark ? "#1a2235" : "#f1f5f9" },
                    ]}
                    onPress={() => setMode('repay')}
                  >
                    <Ionicons name="cash-outline" size={24} color={mode === 'repay' ? colors.accent : colors.textMuted} />
                    <AppText style={[styles.modeText, { color: mode === 'repay' ? colors.accent : colors.text }]}>중도 상환</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      mode === 'refinance'
                        ? { borderColor: colors.accent, backgroundColor: colors.accentBg }
                        : { backgroundColor: isDark ? "#1a2235" : "#f1f5f9" },
                    ]}
                    onPress={() => setMode('refinance')}
                  >
                    <Ionicons name="swap-horizontal-outline" size={24} color={mode === 'refinance' ? colors.accent : colors.textMuted} />
                    <AppText style={[styles.modeText, { color: mode === 'refinance' ? colors.accent : colors.text }]}>대환 대출</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 2 && mode === 'repay' && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>2. 상환 정보 입력</AppText>
                
                <AppText style={[styles.label, { color: colors.textSecondary }]}>상환할 금액 (원)</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={formatNumber(repayAmount, 0)}
                  onChangeText={(t) => setRepayAmount(t.replace(/[^0-9]/g, ""))}
                />

                <AppText style={[styles.label, { color: colors.textSecondary }]}>중도상환 수수료율 (%)</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="2.0"
                  keyboardType="decimal-pad"
                  value={penaltyPercent}
                  onChangeText={setPenaltyPercent}
                />

                <AppText style={[styles.label, { color: colors.textSecondary }]}>출금 계좌</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                  {cashAccounts.map(asset => (
                    <TouchableOpacity
                      key={asset.id}
                      style={[styles.assetBtn, sourceAccountId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                      onPress={() => setSourceAccountId(asset.id)}
                    >
                      <AppText style={{ color: sourceAccountId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {step === 2 && mode === 'refinance' && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>2. 새로운 대출 정보</AppText>
                
                <AppText style={[styles.label, { color: colors.textSecondary }]}>새 대출 이름</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="예: 우리은행 대환론"
                  value={newLoanName}
                  onChangeText={setNewLoanName}
                />

                <AppText style={[styles.label, { color: colors.textSecondary }]}>총 대출 금액 (원)</AppText>
                <AppText style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>기존 대출 잔액: ₩{formatNumber(selectedLoan?.amount || 0, 0)}</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={formatNumber(newLoanAmount, 0)}
                  onChangeText={(t) => setNewLoanAmount(t.replace(/[^0-9]/g, ""))}
                />

                <AppText style={[styles.label, { color: colors.textSecondary }]}>매월 상환액 (원)</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={formatNumber(newMonthlyPayment, 0)}
                  onChangeText={(t) => setNewMonthlyPayment(t.replace(/[^0-9]/g, ""))}
                />
              </View>
            )}

            {step === 3 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>3. 최종 확인</AppText>
                <View style={[styles.summaryBox, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", borderColor: colors.cardBorder }]}>
                  {mode === 'repay' ? (
                    <>
                      <AppText style={{ color: colors.text, fontSize: 16 }}>💰 <AppText style={{ fontWeight: '800' }}>{selectedLoan?.name}</AppText> 상환</AppText>
                      <AppText style={{ color: colors.danger, marginTop: 8 }}>• 상환액: -{formatNumber(repayAmount, 0)}원</AppText>
                      <AppText style={{ color: colors.danger }}>• 수수료: -{formatNumber(Math.round(parseNum(repayAmount) * (parseFloat(penaltyPercent) / 100)), 0)}원</AppText>
                      <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>({cashAccounts.find(a => a.id === sourceAccountId)?.name} 계좌에서 출금)</AppText>
                    </>
                  ) : (
                    <>
                      <AppText style={{ color: colors.text, fontSize: 16 }}>🔄 <AppText style={{ fontWeight: '800' }}>{selectedLoan?.name}</AppText> → <AppText style={{ fontWeight: '800' }}>{newLoanName}</AppText></AppText>
                      <AppText style={{ color: colors.accent, marginTop: 8 }}>• 기존 빚 정산: {formatNumber(selectedLoan?.amount || 0, 0)}원</AppText>
                      {parseNum(newLoanAmount) > (selectedLoan?.amount || 0) && (
                        <AppText style={{ color: colors.accent }}>• 추가 입금액: {formatNumber(parseNum(newLoanAmount) - (selectedLoan?.amount || 0), 0)}원</AppText>
                      )}
                      <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>• 매월 {formatNumber(newMonthlyPayment, 0)}원 고정 지출 등록</AppText>
                    </>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.actionRow}>
            {step > 1 && (
              <TouchableOpacity style={styles.navBtn} onPress={() => setStep(step - 1)}>
                <AppText style={{ color: colors.textSecondary, fontWeight: "600" }}>이전</AppText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.nextBtn, 
                { backgroundColor: step < 3 ? colors.text : colors.accent },
                step > 1 && { marginLeft: 20 }
              ]} 
              onPress={step < 3 ? () => mode && setStep(step + 1) : handleSubmit}
              disabled={!mode}
            >
              <AppText style={{ color: step < 3 ? colors.bg : "#FFF", fontWeight: "800" }}>
                {step < 3 ? "다음" : "완료"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    minHeight: "70%", 
    maxHeight: "90%", 
    borderWidth: 0,
    paddingBottom: 40,
    backgroundColor: isDark ? "#0d1a30" : "#ffffff",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  stepIndicator: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 30 },
  stepDot: { width: 40, height: 6, borderRadius: 3 },
  scrollArea: { flex: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 10 },
  input: { 
    height: 54, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    marginBottom: 16, 
    fontSize: 16,
    borderWidth: 0,
    backgroundColor: isDark ? "#050a14" : "#f1f5f9",
  },
  assetScroll: { marginBottom: 24 },
  assetBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    marginRight: 10, 
    minWidth: 100, 
    alignItems: "center",
    borderWidth: 0,
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
  },
  modeContainer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modeBtn: { 
    flex: 1, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    gap: 8,
    borderWidth: 0,
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
  },
  modeText: { fontWeight: '700', fontSize: 15 },
  summaryBox: { 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 0,
    backgroundColor: isDark ? "#121e33" : "#f1f5f9",
  },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 },
  navBtn: { padding: 16 },
  nextBtn: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: "center" },
});
