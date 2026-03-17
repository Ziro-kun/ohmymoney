import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Vibration,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFinanceStore } from "../../src/store/useFinanceStore";
import { useAppTheme } from "../../hooks/useAppTheme";
import { SecurityService } from "../../src/services/SecurityService";
import * as Haptics from "expo-haptics";
import { AppText } from "../../src/components/AppText";

const { width, height } = Dimensions.get("window");

export const SecurityOverlay = () => {
  const {
    isAppLocked,
    setAppLocked,
    isBiometricEnabled,
    pinLength,
    isSecurityEnabled,
  } = useFinanceStore();
  const { colors, isDark } = useAppTheme();
  const [pin, setPin] = useState<string>("");
  const [errorCount, setErrorCount] = useState(0);
  const [hint, setHint] = useState("PIN 번호를 입력하세요");



  const handleBiometric = useCallback(async () => {
    if (isBiometricEnabled) {
      const success = await SecurityService.authenticateBiometric();
      if (success) {
        setAppLocked(false);
      }
    }
  }, [isBiometricEnabled, setAppLocked]);

  useEffect(() => {
    handleBiometric();
  }, []);

  const handlePress = (num: string) => {
    if (pin.length >= pinLength) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === pinLength) {
      verifyPIN(newPin);
    }
  };

  const verifyPIN = async (enteredPin: string) => {
    const isValid = await SecurityService.verifyPIN(enteredPin);
    if (isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAppLocked(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin("");
      setErrorCount((c) => c + 1);
      setHint("PIN 번호가 일치하지 않습니다");
      Vibration.vibrate(400);
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin(pin.slice(0, -1));
  };

  const renderDot = (index: number) => {
    const isActive = index < pin.length;
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
      {isIcon ? val : <Text style={[styles.keyText, { color: colors.text }]}>{val}</Text>}
    </TouchableOpacity>
  );

  // Only show if security is enabled and app is locked
  if (!isSecurityEnabled || !isAppLocked) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={48} color={colors.accent} style={styles.lockIcon} />
        <AppText style={[styles.title, { color: colors.text }]}>잠금 해제</AppText>
        <AppText style={[styles.hint, { color: errorCount > 0 ? colors.danger : colors.textMuted }]}>
          {hint}
        </AppText>

        <View style={styles.dotContainer}>
          {Array(pinLength)
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
            {renderKey(
              <Ionicons name="finger-print" size={28} color={isBiometricEnabled ? colors.accent : "transparent"} />,
              handleBiometric,
              true
            )}
            {renderKey("0", () => handlePress("0"))}
            {renderKey(<Ionicons name="backspace-outline" size={28} color={colors.text} />, handleBackspace, true)}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 50,
  },
  lockIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  hint: {
    fontSize: 16,
    marginBottom: 40,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 60,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  numpad: {
    width: width * 0.8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 28,
    fontWeight: "600",
  },
});
