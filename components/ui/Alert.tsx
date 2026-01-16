import React, {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Alert as RNAlert,
} from "react-native";
import { colors } from "../../lib/tw";

// Types matching React Native Alert.alert signature
export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options: AlertOptions;
}

interface AlertModalHandle {
  show: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => void;
}

// Singleton ref to the AlertModal instance
let alertRef: AlertModalHandle | null = null;

// Internal AlertModal component for web
const AlertModal = forwardRef<AlertModalHandle>((_, ref) => {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 600;
  const modalWidth = isWideScreen ? 400 : width - 48;

  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    message: undefined,
    buttons: [],
    options: {},
  });

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      setState({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: "OK", style: "default" }],
        options: options || {},
      });
    },
    []
  );

  useImperativeHandle(ref, () => ({ show }), [show]);

  const handleButtonPress = (button: AlertButton) => {
    hide();
    button.onPress?.();
  };

  const handleBackdropPress = () => {
    const cancelable = state.options.cancelable !== false; // default true
    if (cancelable) {
      hide();
      state.options.onDismiss?.();
    }
  };

  const getButtonStyle = (button: AlertButton, index: number) => {
    const isCancel = button.style === "cancel";
    const isDestructive = button.style === "destructive";

    if (isDestructive) {
      return styles.buttonDestructive;
    }
    if (isCancel) {
      return styles.buttonCancel;
    }
    return styles.buttonDefault;
  };

  const getButtonTextStyle = (button: AlertButton) => {
    const isCancel = button.style === "cancel";
    const isDestructive = button.style === "destructive";

    if (isDestructive) {
      return styles.buttonTextDestructive;
    }
    if (isCancel) {
      return styles.buttonTextCancel;
    }
    return styles.buttonTextDefault;
  };

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.modalContainer, { width: modalWidth }]}
        >
          {/* Title */}
          <Text style={styles.title}>{state.title}</Text>

          {/* Message */}
          {state.message && (
            <Text style={styles.message}>{state.message}</Text>
          )}

          {/* Buttons */}
          <View
            style={[
              styles.buttonContainer,
              state.buttons.length === 1 && styles.buttonContainerSingle,
            ]}
          >
            {state.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  getButtonStyle(button, index),
                  state.buttons.length > 1 && styles.buttonFlex,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                <Text style={getButtonTextStyle(button)}>
                  {button.text || "OK"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
});

AlertModal.displayName = "AlertModal";

// AlertProvider component - wrap your app with this
export function AlertProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {Platform.OS === "web" && (
        <AlertModal
          ref={(r) => {
            alertRef = r;
          }}
        />
      )}
    </>
  );
}

// Cross-platform Alert object - drop-in replacement for React Native Alert
export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ): void => {
    if (Platform.OS === "web") {
      if (alertRef) {
        alertRef.show(title, message, buttons, options);
      } else {
        // Fallback to browser alert if provider not mounted
        const result = window.confirm(message ? `${title}\n\n${message}` : title);
        if (result) {
          const confirmButton = buttons?.find((b) => b.style !== "cancel");
          confirmButton?.onPress?.();
        } else {
          const cancelButton = buttons?.find((b) => b.style === "cancel");
          cancelButton?.onPress?.();
          options?.onDismiss?.();
        }
      }
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  buttonContainerSingle: {
    justifyContent: "center",
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    minWidth: 80,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonDefault: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: colors.muted,
  },
  buttonDestructive: {
    backgroundColor: colors.destructive,
  },
  buttonTextDefault: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryForeground,
  },
  buttonTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  buttonTextDestructive: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.destructiveForeground,
  },
});
