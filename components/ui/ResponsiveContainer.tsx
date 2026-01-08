import { View, StyleSheet, useWindowDimensions, ViewStyle } from "react-native";
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
}

/**
 * 響應式容器組件
 *
 * 在寬螢幕上限制內容最大寬度並居中
 * 在小螢幕上則填滿整個寬度
 */
export function ResponsiveContainer({
  children,
  style,
  maxWidth = 480,
}: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 600;

  return (
    <View
      style={[
        styles.container,
        isWideScreen && { maxWidth, alignSelf: "center" },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
