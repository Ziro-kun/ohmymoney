import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../hooks/useAppTheme";
import { SecurityService } from "../../src/services/SecurityService";
import * as Haptics from "expo-haptics";
import { AppText } from "../../src/components/AppText";

const { width } = Dimensions.get("window");

interface PinSetupModalProps {
  isVisible: boolean;
  length: 4 | 6;
  mode: "setup" | "verify";
  onClose: () => void;
  onSuccess: (pin?: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isVisible,
  length,
  mode,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useAppTheme();
  const [step, setStep] = useState<"enter" | "confirm" | "verify">("enter");
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setStep(mode === "verify" ? "verify" : "enter");
      setPin("");
      setConfirmPin("");
      setErrorCount(0);
    }
  }, [isVisible, mode]);

  const handlePress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === "enter") {
      if (pin.length >= length) return;
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length) {
        if (validatePinComplexity(newPin)) {
          setTimeout(() => setStep("confirm"), 300);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Vibration.vibrate(400);
          setPin("");
          setErrorCount((c) => c + 1);
        }
      }
    } else if (step === "confirm") {
      if (confirmPin.length >= length) return;
      const newConfirmPin = confirmPin + num;
      setConfirmPin(newConfirmPin);
      if (newConfirmPin.length === length) {
        verifyNewPin(newConfirmPin);
      }
    } else if (step === "verify") {
      if (pin.length >= length) return;
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length) {
        verifyCurrentPin(newPin);
      }
    }
  };

  const verifyCurrentPin = async (entered: string) => {
    const isValid = await SecurityService.verifyPIN(entered);
    if (isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate(400);
      setPin("");
      setErrorCount((c) => c + 1);
    }
  };

  const verifyNewPin = (enteredConfirm: string) => {
    if (pin === enteredConfirm) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(pin);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate(400);
      setErrorCount((c) => c + 1);
      setTimeout(() => {
        setStep("enter");
        setPin("");
        setConfirmPin("");
      }, 500);
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "enter" || step === "verify") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const validatePinComplexity = (p: string) => {
    // 1. Same digits 3 times in a row (e.g. 000, 111)
    for (let i = 0; i <= p.length - 3; i++) {
      if (p[i] === p[i+1] && p[i] === p[i+2]) return false;
    }

    // 2. Sequential digits (e.g. 1234, 4321)
    let isAsc = true;
    let isDesc = true;
    for (let i = 0; i < p.length - 1; i++) {
      const curr = parseInt(p[i]);
      const next = parseInt(p[i+1]);
      if (next !== curr + 1) isAsc = false;
      if (next !== curr - 1) isDesc = false;
    }
    if (isAsc || isDesc) return false;

    return true;
  };

  const currentPinDisplay = step === "confirm" ? confirmPin : pin;

  const renderDot = (index: number) => {
    const isActive = index < currentPinDisplay.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isActive ? colors.accent : colors.textMuted + "30",
            borderColor: isActive ? colors.accent : colors.textMuted + "50",
          },
        ]}
      />
    );
  };

  const renderKey = (val: string | React.ReactNode, onPress: () => void, isIcon = false) => (
    <TouchableOpacity style={styles.key} onPress={onPress}>
      {isIcon ? val : <AppText style={[styles.keyText, { color: colors.text }]}>{val}</AppText>}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <AppText style={[styles.title, { color: colors.text }]}>
            {step === "enter"
              ? "신규 PIN 번호 입력"
              : step === "confirm"
              ? "PIN 번호 확인"
              : "기존 PIN 번호 인증"}
          </AppText>
          <AppText
            style={[
              styles.hint,
              { color: errorCount > 0 ? colors.danger : colors.textMuted },
            ]}
          >
            {errorCount > 0
              ? step === "enter"
                ? "쉬운 번호는 사용할 수 없습니다. (중복/연속 숫자 등)"
                : "PIN 번호가 일치하지 않습니다. 다시 시도하세요."
              : step === "verify"
              ? "현재 사용 중인 PIN 번호를 입력하세요."
              : `${length}자리 숫자를 입력하세요.`}
          </AppText>

          <View style={styles.dotContainer}>
            {Array(length)
              .fill(0)
              .map((_, i) => renderDot(i))}
          </View>

          <View style={styles.numpad}>
            <View style={styles.row}>
              {renderKey("1", () => handlePress("1"))}
              {renderKey("2", () => handlePress("2"))}
              {renderKey("3", () => handlePress("3"))}
            </View>
            <View style={styles.row}>
              {renderKey("4", () => handlePress("4"))}
              {renderKey("5", () => handlePress("5"))}
              {renderKey("6", () => handlePress("6"))}
            </View>
            <View style={styles.row}>
              {renderKey("7", () => handlePress("7"))}
              {renderKey("8", () => handlePress("8"))}
              {renderKey("9", () => handlePress("9"))}
            </View>
            <View style={styles.row}>
              <View style={styles.key} />
              {renderKey("0", () => handlePress("0"))}
              {renderKey(<Ionicons name="backspace-outline" size={28} color={colors.text} />, handleBackspace, true)}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    marginBottom: 40,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 60,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  numpad: {
    width: width * 0.7,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  key: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 26,
    fontWeight: "600",
  },
});
