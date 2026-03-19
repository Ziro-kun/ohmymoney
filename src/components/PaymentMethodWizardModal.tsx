import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useFinanceStore } from "../store/useFinanceStore";
import { AppText } from "./AppText";

interface PaymentMethodWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaymentMethodWizardModal({ visible, onClose }: PaymentMethodWizardModalProps) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { assets, addPaymentMethod } = useFinanceStore();

  const [step, setStep] = useState(1);

  // Step 1: Type
  const [type, setType] = useState<"debit" | "credit" | "cash">("debit");

  // Step 2: Name & Linked Asset
  const [name, setName] = useState("");
  
  // Available assets for linking
  const cashAccounts = assets.filter((a) => a.type === "asset" && ["cash", "deposit"].includes(a.assetCategory || ""));
  const creditAccounts = assets.filter((a) => a.type === "liability" && a.assetCategory === "loan");
  
  const [linkedAssetId, setLinkedAssetId] = useState<number | undefined>(undefined);

  // Step 3: Credit Card specifics
  const [billingDay, setBillingDay] = useState("");
  const [billingAssetId, setBillingAssetId] = useState<number | undefined>(undefined);

  // Set defaults when visible opens
  useEffect(() => {
    if (visible) {
      if (type === "credit" && creditAccounts.length > 0) {
        setLinkedAssetId(creditAccounts[0].id);
      } else if (cashAccounts.length > 0) {
        setLinkedAssetId(cashAccounts[0].id);
      }
      if (cashAccounts.length > 0) {
        setBillingAssetId(cashAccounts[0].id);
      }
    }
  }, [visible, type]);

  const resetAndClose = () => {
    setStep(1);
    setType("debit");
    setName("");
    setLinkedAssetId(cashAccounts.length > 0 ? cashAccounts[0].id : undefined);
    setBillingDay("");
    setBillingAssetId(cashAccounts.length > 0 ? cashAccounts[0].id : undefined);
    onClose();
  };

  const handleNext = () => {
    if (step === 2) {
      if (!name || !linkedAssetId) return; // Validation
      if (type !== "credit") {
        setStep(4);
        return;
      }
    } else if (step === 3) {
      if (!billingDay || parseInt(billingDay, 10) < 1 || parseInt(billingDay, 10) > 31) return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step === 4 && type !== "credit") {
      setStep(2);
      return;
    }
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!linkedAssetId) return;
    
    await addPaymentMethod(
      name,
      type,
      linkedAssetId,
      type === "credit" ? parseInt(billingDay, 10) || null : null,
      type === "credit" ? billingAssetId : null,
      null // color could be added later
    );
    resetAndClose();
  };

  const renderStepIndicator = () => {
    const totalSteps = type === "credit" ? 4 : 3;
    const currentStepIndex = step === 4 ? totalSteps : step;
    
    return (
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.stepDot,
              { backgroundColor: idx + 1 === currentStepIndex ? colors.accent : colors.cardBorder },
            ]}
          />
        ))}
      </View>
    );
  };

  const getTargetAssetOptions = () => {
    if (type === "credit") {
      return creditAccounts.length > 0 ? creditAccounts : assets;
    }
    return cashAccounts.length > 0 ? cashAccounts : assets;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={resetAndClose}>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)" }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: isDark ? "#0d1a30" : "#ffffff", borderColor: colors.cardBorder }]}>
              <View style={styles.headerRow}>
                <AppText style={[styles.modalTitle, { color: colors.text }]}>결제수단 등록</AppText>
                <TouchableOpacity onPress={resetAndClose}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {renderStepIndicator()}

              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {step === 1 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>1. 어떤 결제수단인가요?</AppText>
                    
                    <View style={styles.row}>
                      {(["debit", "credit", "cash"] as const).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.catBtn,
                            type === cat && { backgroundColor: colors.accentBg, borderColor: colors.accent },
                            type !== cat && { borderColor: colors.cardBorder }
                          ]}
                          onPress={() => {
                            setType(cat);
                            setName("");
                          }}
                        >
                          <Ionicons 
                            name={cat === "credit" ? "card" : cat === "debit" ? "card-outline" : "cash-outline"} 
                            size={24} 
                            color={type === cat ? colors.accent : colors.textMuted} 
                            style={{ marginBottom: 8 }}
                          />
                          <AppText style={[styles.catBtnText, { color: type === cat ? colors.accent : colors.textMuted }]}>
                            {cat === "debit" ? "체크카드" : cat === "credit" ? "신용카드" : "현금"}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {step === 2 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>2. 기본 정보 입력</AppText>
                    
                    <AppText style={[styles.label, { color: colors.textSecondary }]}>결제수단 이름 (별칭)</AppText>
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                      placeholder={type === "credit" ? "예: 신한 딥드림 카드" : type === "debit" ? "예: 토스뱅크 체크카드" : "지갑 현금"}
                      placeholderTextColor={colors.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoFocus
                    />

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>
                      {type === "credit" ? "연결할 부채 계좌 (신용카드 대금)" : "연결된 입출금 계좌"}
                    </AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted, marginTop: -4, marginBottom: 12 }]}>
                      {type === "credit" 
                        ? "카드 결제 시 해당 부채 계좌의 잔액(빚)이 늘어납니다." 
                        : "결제 즉시 해당 계좌에서 금액이 차감됩니다."}
                    </AppText>
                    
                    {getTargetAssetOptions().length === 0 ? (
                      <AppText style={{ color: colors.danger, marginBottom: 20 }}>
                        {type === "credit" ? "등록된 부채/대출 계좌가 없습니다. 자산을 먼저 추가해주세요." : "등록된 현금성 자산이 없습니다. 자산을 먼저 추가해주세요."}
                      </AppText>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                        {getTargetAssetOptions().map(asset => (
                          <TouchableOpacity
                            key={asset.id}
                            style={[
                              styles.assetBtn,
                              linkedAssetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                              linkedAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                            ]}
                            onPress={() => setLinkedAssetId(asset.id)}
                          >
                            <AppText style={{ color: linkedAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                {step === 3 && type === "credit" && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>3. 신용카드 결제일 설정</AppText>
                    
                    <AppText style={[styles.label, { color: colors.textSecondary }]}>결제일 (매월)</AppText>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
                        placeholder="1 ~ 31"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        value={billingDay}
                        onChangeText={(text) => {
                          const val = text.replace(/[^0-9]/g, "");
                          if (val === "" || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 31)) {
                            setBillingDay(val);
                          }
                        }}
                      />
                      <AppText style={{ fontSize: 18, color: colors.text, marginLeft: 12 }}>일</AppText>
                    </View>

                    <AppText style={[styles.label, { color: colors.textSecondary }]}>결제 대금 출금 계좌 (자동이체)</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted, marginTop: -4, marginBottom: 12 }]}>
                      결제일에 이 계좌에서 카드값이 빠져나갑니다.
                    </AppText>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetScroll}>
                      {cashAccounts.map(asset => (
                        <TouchableOpacity
                          key={asset.id}
                          style={[
                            styles.assetBtn,
                            billingAssetId === asset.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                            billingAssetId !== asset.id && { borderColor: colors.cardBorder, backgroundColor: colors.bgSecondary }
                          ]}
                          onPress={() => setBillingAssetId(asset.id)}
                        >
                          <AppText style={{ color: billingAssetId === asset.id ? "#FFF" : colors.text, fontWeight: "600" }}>{asset.name}</AppText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {step === 4 && (
                  <View>
                    <AppText style={[styles.sectionTitle, { color: colors.text }]}>최종 확인</AppText>
                    <AppText style={[styles.desc, { color: colors.textMuted, marginBottom: 20 }]}>입력하신 정보가 맞는지 확인해주세요.</AppText>

                    <View style={[styles.summaryBox, { backgroundColor: isDark ? colors.bgSecondary : "#f8f9fb", borderColor: colors.cardBorder }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <Ionicons 
                          name={type === "credit" ? "card" : type === "debit" ? "card-outline" : "cash-outline"} 
                          size={28} 
                          color={colors.accent} 
                          style={{ marginRight: 12 }}
                        />
                        <View>
                          <AppText style={[styles.summaryItem, { color: colors.text, fontWeight: "800", fontSize: 18 }]}>
                            {name}
                          </AppText>
                          <AppText style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                            {type === "debit" ? "체크카드" : type === "credit" ? "신용카드" : "현금"}
                          </AppText>
                        </View>
                      </View>

                      <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 12 }} />

                      <AppText style={[styles.summaryItem, { color: colors.text, marginTop: 8 }]}>
                        🔗 연결 계좌: <AppText style={{ fontWeight: "700" }}>{assets.find(a => a.id === linkedAssetId)?.name}</AppText>
                      </AppText>

                      {type === "credit" && (
                        <>
                          <AppText style={[styles.summaryItem, { color: colors.text, marginTop: 8 }]}>
                            📅 매월 결제일: <AppText style={{ fontWeight: "700" }}>{billingDay}일</AppText>
                          </AppText>
                          <AppText style={[styles.summaryItem, { color: colors.text, marginTop: 8 }]}>
                            💸 자동이체 출금: <AppText style={{ fontWeight: "700" }}>{assets.find(a => a.id === billingAssetId)?.name}</AppText>
                          </AppText>
                        </>
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
                    { backgroundColor: step < 4 ? colors.text : colors.accent },
                    step > 1 && { marginLeft: 20 }
                  ]} 
                  onPress={step < 4 ? handleNext : handleSubmit}
                  disabled={
                    (step === 2 && (!name || !linkedAssetId)) || 
                    (step === 3 && (!billingDay || !billingAssetId))
                  }
                >
                  <AppText style={{ color: step < 4 ? colors.bg : "#FFF", fontWeight: "800" }}>
                    {step < 4 ? "다음" : "완료 및 등록"}
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
    minHeight: "65%",
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
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 1,
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
  assetScroll: { marginBottom: 24 },
  assetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    minWidth: 90,
    alignItems: "center",
    backgroundColor: isDark ? "#1a2235" : "#f1f5f9",
    borderWidth: 1,
  },
  summaryBox: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: isDark ? "#121e33" : "#f1f5f9",
    borderWidth: 1,
  },
  summaryItem: {
    fontSize: 15,
    marginBottom: 4,
  },
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
