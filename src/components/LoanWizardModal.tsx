import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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

interface LoanWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LoanWizardModal({ visible, onClose }: LoanWizardModalProps) {
  const { colors, isDark } = useAppTheme();
  const { assets, addLoan } = useFinanceStore();

  const [step, setStep] = useState(1);

  // States
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [payoutType, setPayoutType] = useState<"account" | "direct">("account");
  
  const availableCashAssets = assets.filter((a) => a.type === "asset");
  const [targetAssetId, setTargetAssetId] = useState<number | undefined>(
    availableCashAssets.length > 0 ? availableCashAssets[0].id : undefined
  );

  const [monthlyPayment, setMonthlyPayment] = useState("");

  const resetAndClose = () => {
    setStep(1);
    setLoanName("");
    setLoanAmount("");
    setPayoutType("account");
    setTargetAssetId(availableCashAssets.length > 0 ? availableCashAssets[0].id : undefined);
    setMonthlyPayment("");
    onClose();
  };

  const parseNum = (val: string) => parseInt(val.replace(/,/g, "") || "0", 10);

  const handleNext = () => {
    if (step === 1) {
      if (!loanName || parseNum(loanAmount) <= 0) return;
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    await addLoan(
      loanName,
      parseNum(loanAmount),
      targetAssetId,
      parseNum(monthlyPayment),
      payoutType
    );
    resetAndClose();
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              { backgroundColor: s === step ? colors.accent : colors.cardBorder },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? "#0d1a30" : "#ffffff", borderColor: colors.cardBorder }]}>
          <View style={styles.headerRow}>
            <AppText style={[styles.modalTitle, { color: colors.text }]}>대출 등록 마법사</AppText>
            <TouchableOpacity onPress={resetAndClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {renderStepIndicator()}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>1. 대출 정보를 입력해주세요</AppText>
                <AppText style={[styles.desc, { color: colors.textMuted }]}>빌리신 대출의 이름과 총 금액을 입력합니다.</AppText>

                <AppText style={[styles.label, { color: colors.textSecondary }]}>대출 이름</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                  placeholder="예: 카카오뱅크 비상금대출"
                  placeholderTextColor={colors.textMuted}
                  value={loanName}
                  onChangeText={setLoanName}
                />

                <AppText style={[styles.label, { color: colors.textSecondary }]}>대출 금액 (원)</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input, fontSize: 24, fontWeight: "800", height: 60 }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={formatNumber(loanAmount, 0)}
                  onChangeText={(text) => setLoanAmount(text.replace(/[^0-9]/g, ""))}
                />
              </View>
            )}

            {step === 2 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>2. 대출금 지급 방식</AppText>
                <AppText style={[styles.desc, { color: colors.textMuted }]}>대출금이 내 통장으로 들어왔나요, 아니면 기관으로 바로 지급되었나요?</AppText>
                
                <View style={[styles.row, { marginBottom: 24, flexDirection: 'row', gap: 10 }]}>
                  <TouchableOpacity
                    style={[
                      styles.assetBtn,
                      { flex: 1 },
                      payoutType === "account"
                        ? { backgroundColor: colors.accentBg, borderColor: colors.accent }
                        : { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary },
                    ]}
                    onPress={() => setPayoutType("account")}
                  >
                    <Ionicons name="home" size={20} color={payoutType === "account" ? colors.accent : colors.textMuted} />
                    <AppText style={{ color: payoutType === "account" ? colors.accent : colors.text, fontWeight: "600", marginTop: 4 }}>내 계좌로 받음</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.assetBtn,
                      { flex: 1 },
                      payoutType === "direct"
                        ? { backgroundColor: colors.accentBg, borderColor: colors.accent }
                        : { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary },
                    ]}
                    onPress={() => setPayoutType("direct")}
                  >
                    <Ionicons name="arrow-forward-circle" size={20} color={payoutType === "direct" ? colors.accent : colors.textMuted} />
                    <AppText style={{ color: payoutType === "direct" ? colors.accent : colors.text, fontWeight: "600", marginTop: 4 }}>기관 직접 지급</AppText>
                  </TouchableOpacity>
                </View>

                {payoutType === "account" && (
                  <>
                    <AppText style={[styles.label, { color: colors.textSecondary }]}>입금 및 상환 계좌 선택</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                      {availableCashAssets.map(asset => (
                        <TouchableOpacity
                          key={asset.id}
                          style={[
                            styles.assetBtn,
                            targetAssetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                            targetAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                          ]}
                          onPress={() => setTargetAssetId(asset.id)}
                        >
                          <AppText style={{ color: targetAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {payoutType === "direct" && (
                  <View style={[styles.infoBox, { backgroundColor: colors.bgSecondary, padding: 16, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                    <AppText style={{ color: colors.textSecondary, flex: 1, fontSize: 13 }}>
                      학자금 대출처럼 기관으로 직접 지급되는 경우, 내 계좌 잔액은 변하지 않고 부채만 등록됩니다. (순자산 감소)
                    </AppText>
                  </View>
                )}
              </View>
            )}

            {step === 3 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>3. 상환 계획 (옵션)</AppText>
                <AppText style={[styles.desc, { color: colors.textMuted }]}>매달 갚아야 할 원리금이 있다면 입력해주세요. 자동으로 고정 지출에 등록됩니다.</AppText>

                <AppText style={[styles.label, { color: colors.textSecondary }]}>매월 상환액 (원)</AppText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input, fontSize: 20, fontWeight: "700" }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={formatNumber(monthlyPayment, 0)}
                  onChangeText={(text) => setMonthlyPayment(text.replace(/[^0-9]/g, ""))}
                />

                {payoutType === "direct" && (
                  <>
                    <AppText style={[styles.label, { color: colors.textSecondary }]}>출금 계좌 선택 (상환용)</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                      {availableCashAssets.map(asset => (
                        <TouchableOpacity
                          key={asset.id}
                          style={[
                            styles.assetBtn,
                            targetAssetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                            targetAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                          ]}
                          onPress={() => setTargetAssetId(asset.id)}
                        >
                          <AppText style={{ color: targetAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            )}

            {step === 4 && (
              <View>
                <AppText style={[styles.sectionTitle, { color: colors.text }]}>4. 최종 확인</AppText>
                <AppText style={[styles.desc, { color: colors.textMuted, marginBottom: 20 }]}>대출 실행 시 다음 항목들이 자동으로 처리됩니다.</AppText>

                <View style={[styles.summaryBox, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", borderColor: colors.cardBorder, padding: 20, borderRadius: 20, borderWidth: 1 }]}>
                  {payoutType === "account" ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="add-circle" size={20} color={colors.accent} />
                        <AppText style={{ fontSize: 16, color: colors.text }}>
                          계좌 입금: <AppText style={{ fontWeight: "800" }}>+{formatNumber(loanAmount, 0)}원</AppText>
                        </AppText>
                      </View>
                      <AppText style={{ fontSize: 13, marginLeft: 28, marginTop: 2, color: colors.textMuted }}>({availableCashAssets.find(a => a.id === targetAssetId)?.name} 계좌)</AppText>
                    </>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="flash" size={20} color={colors.danger} />
                      <AppText style={{ fontSize: 16, color: colors.text }}>
                        직접 지불 완료: <AppText style={{ fontWeight: "800" }}>{formatNumber(loanAmount, 0)}원</AppText>
                      </AppText>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Ionicons name="remove-circle" size={20} color={colors.danger} />
                    <AppText style={{ fontSize: 16, color: colors.text }}>
                      신규 부채: <AppText style={{ fontWeight: "800" }}>{loanName} ({formatNumber(loanAmount, 0)}원)</AppText>
                    </AppText>
                  </View>

                  {parseNum(monthlyPayment) > 0 && (
                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <AppText style={{ fontSize: 16, color: colors.text }}>
                        📅 매월 <AppText style={{ fontWeight: "800" }}>{formatNumber(monthlyPayment, 0)}원</AppText> 상환 지출 등록
                      </AppText>
                      <AppText style={{ fontSize: 13, marginLeft: 0, marginTop: 4, color: colors.textMuted }}>({availableCashAssets.find(a => a.id === targetAssetId)?.name} 계좌에서 출금)</AppText>
                    </View>
                  )}
                </View>

                <AppText style={{ fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 24, color: payoutType === "account" ? colors.accent : colors.danger }}>
                  {payoutType === "account" 
                    ? "💡 대출금과 부채가 동시에 등록되어 순자산은 변하지 않습니다."
                    : "💡 현금이 입금되지 않고 부채만 생성되어 순자산이 감소합니다."}
                </AppText>
              </View>
            )}
          </ScrollView>

          <View style={styles.actionRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
                <AppText style={{ color: colors.textSecondary, fontWeight: "600" }}>이전</AppText>
              </TouchableOpacity>
            ) : <View style={{ width: 60 }} />}
            
            {step < 4 ? (
              <TouchableOpacity 
                style={[styles.nextBtn, { backgroundColor: colors.text }]} 
                onPress={handleNext}
                disabled={step === 1 && (!loanName || parseNum(loanAmount) <= 0)}
              >
                <AppText style={{ color: colors.bg, fontWeight: "700" }}>다음</AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.nextBtn, { backgroundColor: colors.accent }]} 
                onPress={handleSubmit}
              >
                <AppText style={{ color: "#FFF", fontWeight: "800" }}>대출 등록 완료</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: "65%", maxHeight: "90%", borderWidth: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  stepIndicator: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 30 },
  stepDot: { width: 40, height: 6, borderRadius: 3 },
  scrollArea: { flex: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 24, fontSize: 16 },
  assetScroll: { marginBottom: 24 },
  assetBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginRight: 10, minWidth: 80, alignItems: "center" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 },
  navBtn: { padding: 16 },
  nextBtn: { flex: 1, marginLeft: 20, paddingVertical: 18, borderRadius: 16, alignItems: "center" },
});
