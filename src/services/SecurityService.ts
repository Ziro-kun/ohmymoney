import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "user_pin_code";

export const SecurityService = {
  /**
   * Check if biometrics are available and enrolled on the device
   */
  isBiometricAvailable: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /**
   * Perform biometric authentication
   */
  authenticateBiometric: async (reason: string = "보안 인증이 필요합니다") => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "PIN 번호 사용",
      disableDeviceFallback: false,
    });
    return result.success;
  },

  /**
   * Save PIN securely
   */
  savePIN: async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  },

  /**
   * Verify entered PIN
   */
  verifyPIN: async (enteredPin: string) => {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    return savedPin === enteredPin;
  },

  /**
   * Check if PIN is registered
   */
  hasPIN: async () => {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    return !!savedPin;
  },

  /**
   * Clear PIN (e.g., when disabling security)
   */
  clearPIN: async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
  },
};
