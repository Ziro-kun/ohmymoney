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
import * as Haptics from "expo-haptics";
import { AppText } from "../../src/components/AppText";

const { width } = Dimensions.get("window");

interface PinSetupModalProps {
  isVisible: boolean;
  length: 4 | 6;
  onClose: () => void;
  onSuccess: (pin: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isVisible,
  length,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useAppTheme();
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setStep("enter");
      setPin("");
      setConfirmPin("");
      setErrorCount(0);
    }
  }, [isVisible]);

  const handlePress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === "enter") {
      if (pin.length >= length) return;
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === length) {
        setTimeout(() => setStep("confirm"), 300);
      }
    } else {
      if (confirmPin.length >= length) return;
      const newConfirmPin = confirmPin + num;
      setConfirmPin(newConfirmPin);
      if (newConfirmPin.length === length) {
        verify(newConfirmPin);
      }
    }
  };

  const verify = (enteredConfirm: string) => {
    if (pin === enteredConfirm) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(pin);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate(400);
      setErrorCount(c => c + 1);
      setTimeout(() => {
        setStep("enter");
        setPin("");
        setConfirmPin("");
      }, 500);
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "enter") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const currentPin = step === "enter" ? pin : confirmPin;

  const renderDot = (index: number) => {
    const isActive = index < currentPin.length;
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
            {step === "enter" ? "신규 PIN 번호 입력" : "PIN 번호 확인"}
          </AppText>
          <AppText style={[styles.hint, { color: errorCount > 0 ? colors.danger : colors.textMuted }]}>
            {errorCount > 0 ? "PIN 번호가 일치하지 않습니다. 다시 시도하세요." : `${length}자리 숫자를 입력하세요.`}
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
