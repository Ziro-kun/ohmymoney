import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../store/useFinanceStore";
import { AppText } from "./AppText";
import { formatNumber } from "../utils/format";

interface AssetWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AssetWizardModal({ visible, onClose }: AssetWizardModalProps) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { assets, addComplexAsset } = useFinanceStore();

  const [step, setStep] = useState(1);

  // Step 1: Base
  const [assetCategory, setAssetCategory] = useState<"real_estate" | "vehicle" | "other">("vehicle");
  const [assetName, setAssetName] = useState("");
  const [totalValue, setTotalValue] = useState("");

  // Step 2: Asset Registration Options
  const [registerAsAsset, setRegisterAsAsset] = useState(true);
  const [applyDepreciation, setApplyDepreciation] = useState(true);
  const [depreciationRate, setDepreciationRate] = useState("10"); // percent per year

  // Step 3 & 4: Payment & Loan
  const availableCashAssets = assets.filter((a) => a.type === "asset");
  const [cashAssetId, setCashAssetId] = useState<number | undefined>(
    availableCashAssets.length > 0 ? availableCashAssets[0].id : undefined
  );
  const [downPayment, setDownPayment] = useState("");
  const [loanName, setLoanName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");

  const resetAndClose = () => {
    setStep(1);
    setAssetCategory("vehicle");
    setAssetName("");
    setTotalValue("");
    setRegisterAsAsset(true);
    setApplyDepreciation(true);
    setDepreciationRate("10");
    setCashAssetId(availableCashAssets.length > 0 ? availableCashAssets[0].id : undefined);
    setDownPayment("");
    setLoanName("");
    setLoanAmount("");
    setMonthlyPayment("");
    onClose();
  };

  const parseNum = (val: string) => parseInt(val.replace(/,/g, "") || "0", 10);

  const handleNext = () => {
    if (step === 1) {
      if (!assetName || parseNum(totalValue) <= 0) return;
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    await addComplexAsset(
      assetName,
      parseNum(totalValue),
      assetCategory,
      applyDepreciation ? parseFloat(depreciationRate || "0") : 0,
      registerAsAsset,
      cashAssetId,
      parseNum(downPayment),
      loanName,
      parseNum(loanAmount),
      parseNum(monthlyPayment)
    );
    resetAndClose();
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4, 5].map((s) => (
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
      <TouchableWithoutFeedback onPress={resetAndClose}>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)" }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: isDark ? "#0d1a30" : "#ffffff", borderColor: colors.cardBorder }]}>
              <View style={styles.headerRow}>
                <AppText style={[styles.modalTitle, { color: colors.text }]}>자산 등록 마법사</AppText>
                <TouchableOpacity onPress={resetAndClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {renderStepIndicator()}

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {step === 1 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>1. 어떤 자산을 구매하셨나요?</AppText>
                    
                    <View style={styles.row}>
                      {(["real_estate", "vehicle", "other"] as const).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.catBtn,
                            assetCategory === cat && { backgroundColor: colors.accentBg, borderColor: colors.accent },
                            assetCategory !== cat && { borderColor: colors.cardBorder }
                          ]}
                          onPress={() => setAssetCategory(cat)}
                        >
                          <AppText style={[styles.catBtnText, { color: assetCategory === cat ? colors.accent : colors.textMuted }]}>
                            {cat === "real_estate" ? "주택/부동산" : cat === "vehicle" ? "자동차" : "기타"}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>자산 이름</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                      placeholder="예: 내 첫 차, 래미안 아파트"
                      placeholderTextColor={colors.textMuted}
                      value={assetName}
                      onChangeText={setAssetName}
                    />

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>총 구매 가격 (원)</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input, fontSize: 24, fontWeight: "800", height: 60 }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={formatNumber(totalValue, 0)}
                      onChangeText={(text) => setTotalValue(text.replace(/[^0-9]/g, ""))}
                    />
                  </View>
                )}

                {step === 2 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>2. 순자산 포함 설정</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted }]}>이 항목의 현재 가치를 나의 총 순자산 계산에 포함할지 결정합니다.</AppText>
                    
                    <View style={[styles.toggleRow, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb" }]}>
                      <View style={{ flex: 1 }}>
                        <AppText style={[styles.toggleTitle, { color: colors.text }]}>자산으로 등재하기</AppText>
                        <AppText style={[styles.toggleSub, { color: colors.textMuted }]}>순자산 뷰에 반영됩니다.</AppText>
                      </View>
                      <Switch
                        value={registerAsAsset}
                        onValueChange={setRegisterAsAsset}
                        trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
                      />
                    </View>

                    {registerAsAsset && assetCategory === "vehicle" && (
                      <View style={{ marginTop: 20 }}>
                        <View style={[styles.toggleRow, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb" }]}>
                          <View style={{ flex: 1 }}>
                            <AppText style={[styles.toggleTitle, { color: colors.text }]}>감가상각 자동 적용</AppText>
                            <AppText style={[styles.toggleSub, { color: colors.textMuted }]}>매년 자산 가치를 깎습니다.</AppText>
                          </View>
                          <Switch
                            value={applyDepreciation}
                            onValueChange={setApplyDepreciation}
                            trackColor={{ false: isDark ? "#333" : "#ddd", true: colors.accent }}
                          />
                        </View>

                        {applyDepreciation && (
                          <View style={{ marginTop: 10 }}>
                            <AppText style={[styles.label, { color: colors.textSecondary }]}>연간 감가상각률 (%)</AppText>
                            <TextInput
                              style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                              placeholder="10"
                              keyboardType="decimal-pad"
                              value={depreciationRate}
                              onChangeText={setDepreciationRate}
                            />

                            {/* Depreciation preview table */}
                            {parseNum(totalValue) > 0 && parseFloat(depreciationRate || "0") > 0 && (
                              <View style={[styles.deprPreview, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb" }]}>
                                <AppText style={[styles.deprPreviewTitle, { color: colors.textMuted }]}>
                                  📉 감가상각 시뮬레이션
                                </AppText>
                                {[1, 2, 3, 5, 10].map((year) => {
                                  const rate = parseFloat(depreciationRate || "0") / 100;
                                  const value = Math.max(0, parseNum(totalValue) * (1 - rate * year));
                                  const pct = Math.min(100, Math.round(rate * year * 100));
                                  return (
                                    <View key={year} style={styles.deprRow}>
                                      <AppText style={[styles.deprYear, { color: colors.textSecondary }]}>{year}년 후</AppText>
                                      <AppText style={[styles.deprValue, { color: value <= 0 ? colors.danger : colors.text }]}>
                                        {value <= 0 ? "0원 (잔존가치 없음)" : `₩${formatNumber(Math.round(value), 0)}`}
                                      </AppText>
                                      <AppText style={[styles.deprPct, { color: colors.textMuted }]}>(-{pct}%)</AppText>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {step === 3 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>3. 결제 수단 (선수금/현금)</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted }]}>초기에 직접 지불한(또는 지불할) 현금입니다. 대출 없이 전액 현금인 경우 전체 금액을 입력하세요.</AppText>
                    
                    <AppText style={[styles.label, { color: colors.textSecondary }]}>출금 계좌 선택</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                      {availableCashAssets.map(asset => (
                        <TouchableOpacity
                          key={asset.id}
                          style={[
                            styles.assetBtn,
                            cashAssetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                            cashAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                          ]}
                          onPress={() => setCashAssetId(asset.id)}
                        >
                          <AppText style={{ color: cashAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>지불할 선수금 (원)</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input, fontSize: 24, fontWeight: "800", height: 60 }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={formatNumber(downPayment, 0)}
                      onChangeText={(text) => setDownPayment(text.replace(/[^0-9]/g, ""))}
                    />
                  </View>
                )}

                {step === 4 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>4. 대출 및 할부 (옵션)</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted }]}>나머지 금액을 대출이나 할부로 결제했다면 입력해주세요. 없으면 빈 칸으로 두고 넘어가세요.</AppText>

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>대출/할부 기관명</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                      placeholder="예: 현대캐피탈, 신한은행 전세대출"
                      placeholderTextColor={colors.textMuted}
                      value={loanName}
                      onChangeText={setLoanName}
                    />

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>총 대출 금액 (원)</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={formatNumber(loanAmount, 0)}
                      onChangeText={(text) => setLoanAmount(text.replace(/[^0-9]/g, ""))}
                    />

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>매월 상환액 (원)</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={formatNumber(monthlyPayment, 0)}
                      onChangeText={(text) => setMonthlyPayment(text.replace(/[^0-9]/g, ""))}
                    />
                  </View>
                )}

                {step === 5 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>5. 최종 확인</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted, marginBottom: 20 }]}>입력하신 내용에 따라 다음 항목들이 자동 등록됩니다.</AppText>

                    <View style={[styles.summaryBox, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", borderColor: colors.cardBorder }]}>
                      <AppText style={[styles.summaryItem, { color: colors.text }]}>
                        📦 <AppText style={{ fontWeight: "800" }}>{assetName}</AppText> (총 {formatNumber(totalValue, 0)}원)
                      </AppText>
                      {registerAsAsset ? (
                        <AppText style={[styles.summarySub, { color: colors.accent }]}>✓ 순자산에 편입됨 {assetCategory === 'vehicle' ? `(연 ${depreciationRate}% 감가)` : ''}</AppText>
                      ) : (
                        <AppText style={[styles.summarySub, { color: colors.textMuted }]}>✓ 순자산에서 제외됨 (단순 지출)</AppText>
                      )}

                      {parseNum(downPayment) > 0 && (
                        <View style={{ marginTop: 16 }}>
                          <AppText style={[styles.summaryItem, { color: colors.text }]}>
                            💸 선수금 지출: <AppText style={{ color: colors.danger, fontWeight: "800" }}>-{formatNumber(downPayment, 0)}원</AppText>
                          </AppText>
                          <AppText style={[styles.summarySub, { color: colors.textMuted }]}>({availableCashAssets.find(a => a.id === cashAssetId)?.name}에서 차감)</AppText>
                        </View>
                      )}

                      {parseNum(loanAmount) > 0 && (
                        <View style={{ marginTop: 16 }}>
                          <AppText style={[styles.summaryItem, { color: colors.text }]}>
                            🏦 신규 부채 등록: <AppText style={{ fontWeight: "800" }}>{loanName} ({formatNumber(loanAmount, 0)}원)</AppText>
                          </AppText>
                          <AppText style={[styles.summarySub, { color: colors.textMuted }]}>매월 {formatNumber(monthlyPayment, 0)}원 고정 지출 추가</AppText>
                        </View>
                      )}
                    </View>
                  </View>
                )}

              </ScrollView>

              <View style={styles.actionRow}>
                {step > 1 && (
                  <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
                    <AppText style={{ color: colors.textSecondary, fontWeight: "600" }}>이전</AppText>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.nextBtn, 
                    { backgroundColor: step < 5 ? colors.text : colors.accent },
                    step > 1 && { marginLeft: 20 }
                  ]} 
                  onPress={step < 5 ? handleNext : handleSubmit}
                  disabled={step === 1 && (!assetName || parseNum(totalValue) <= 0)}
                >
                  <AppText style={{ color: step < 5 ? colors.bg : "#FFF", fontWeight: "800" }}>
                    {step < 5 ? "다음" : "완료 및 등록"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: "75%",
    maxHeight: "90%",
    backgroundColor: isDark ? "#0d1a30" : "#ffffff",
    borderWidth: 0,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 30,
  },
  stepDot: {
    width: 30,
    height: 6,
    borderRadius: 3,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  catBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: isDark ? "#050a14" : "#f1f5f9",
    borderWidth: 0,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: isDark ? "#1a2235" : "#f8fafc",
  },
  toggleTitle: { fontSize: 16, fontWeight: "700" },
  toggleSub: { fontSize: 13, marginTop: 4 },
  assetScroll: { marginBottom: 24 },
  assetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 10,
    minWidth: 80,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 0,
  },
  summaryBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: isDark ? "#121e33" : "#f1f5f9",
    borderWidth: 0,
  },
  summaryItem: {
    fontSize: 16,
    marginBottom: 4,
  },
  summarySub: {
    fontSize: 13,
    marginLeft: 26,
  },
  deprPreview: {
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  deprPreviewTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  deprRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 8,
  },
  deprYear: { width: 48, fontSize: 13, fontWeight: "600" },
  deprValue: { flex: 1, fontSize: 13, fontWeight: "700" },
  deprPct: { fontSize: 12 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  navBtn: {
    padding: 16,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
});
