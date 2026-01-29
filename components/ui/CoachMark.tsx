import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  LayoutRectangle,
  Modal,
} from "react-native";
import { colors } from "../../lib/tw";

/** 單步 coach mark 定義 */
export interface CoachMarkStep {
  /** 要高亮的目標元素 ref */
  targetRef: React.RefObject<View | null>;
  /** 說明文字 */
  text: string;
}

export interface CoachMarkOverlayProps {
  /** 是否顯示 */
  visible: boolean;
  /** 所有步驟 */
  steps: CoachMarkStep[];
  /** 全部完成時的回調 */
  onComplete: () => void;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_MARGIN = 12;
const TOOLTIP_WIDTH = 280;

/**
 * CoachMark 教學覆蓋層
 *
 * 以半透明遮罩 + 聚光燈高亮 + 工具提示卡的方式引導使用者。
 * 支持多步驟連續顯示，每步都有「知道了」按鈕推進。
 */
export function CoachMarkOverlay({
  visible,
  steps,
  onComplete,
}: CoachMarkOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<LayoutRectangle | null>(null);
  const measureAttemptRef = useRef(0);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  // 重置步驟
  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      setTargetRect(null);
    }
  }, [visible]);

  // 測量目標元素位置
  useEffect(() => {
    if (!visible || !currentStep?.targetRef?.current) {
      setTargetRect(null);
      return;
    }

    measureAttemptRef.current = 0;

    const measure = () => {
      currentStep.targetRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setTargetRect({ x, y, width, height });
        } else if (measureAttemptRef.current < 10) {
          // 元素可能還沒 layout 完成，重試
          measureAttemptRef.current++;
          setTimeout(measure, 100);
        } else {
          // 測量失敗，使用螢幕中心的預設位置
          setTargetRect({
            x: screenWidth * 0.1,
            y: screenHeight * 0.3,
            width: screenWidth * 0.8,
            height: 60,
          });
        }
      });
    };

    // 延遲一幀確保 layout 完成
    requestAnimationFrame(measure);
  }, [visible, currentStepIndex, currentStep, screenWidth, screenHeight]);

  const handleDismiss = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTargetRect(null);
    } else {
      onComplete();
    }
  }, [currentStepIndex, totalSteps, onComplete]);

  if (!visible || !currentStep) return null;

  // 計算聚光燈區域（加 padding）
  const spotlight = targetRect
    ? {
        x: targetRect.x - SPOTLIGHT_PADDING,
        y: targetRect.y - SPOTLIGHT_PADDING,
        width: targetRect.width + SPOTLIGHT_PADDING * 2,
        height: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  // 計算 tooltip 位置：優先放在下方，空間不足放上方
  const getTooltipPosition = () => {
    if (!spotlight) {
      return { top: screenHeight * 0.4, left: (screenWidth - TOOLTIP_WIDTH) / 2 };
    }

    const spaceBelow = screenHeight - (spotlight.y + spotlight.height);
    const spaceAbove = spotlight.y;
    const tooltipHeight = 120; // 預估值

    let top: number;
    if (spaceBelow > tooltipHeight + TOOLTIP_MARGIN) {
      top = spotlight.y + spotlight.height + TOOLTIP_MARGIN;
    } else if (spaceAbove > tooltipHeight + TOOLTIP_MARGIN) {
      top = spotlight.y - tooltipHeight - TOOLTIP_MARGIN;
    } else {
      top = screenHeight * 0.4;
    }

    // 水平置中對齊目標，但不超出螢幕
    let left = spotlight.x + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(16, Math.min(left, screenWidth - TOOLTIP_WIDTH - 16));

    return { top, left };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* 半透明遮罩 - 用 4 個黑色區塊圍繞聚光燈 */}
        {spotlight ? (
          <>
            {/* 上方 */}
            <View
              style={[
                styles.overlay,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: spotlight.y,
                },
              ]}
            />
            {/* 左方 */}
            <View
              style={[
                styles.overlay,
                {
                  top: spotlight.y,
                  left: 0,
                  width: spotlight.x,
                  height: spotlight.height,
                },
              ]}
            />
            {/* 右方 */}
            <View
              style={[
                styles.overlay,
                {
                  top: spotlight.y,
                  left: spotlight.x + spotlight.width,
                  right: 0,
                  height: spotlight.height,
                },
              ]}
            />
            {/* 下方 */}
            <View
              style={[
                styles.overlay,
                {
                  top: spotlight.y + spotlight.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
            {/* 聚光燈邊框 */}
            <View
              style={[
                styles.spotlightBorder,
                {
                  top: spotlight.y,
                  left: spotlight.x,
                  width: spotlight.width,
                  height: spotlight.height,
                },
              ]}
            />
          </>
        ) : (
          <View style={[styles.overlay, StyleSheet.absoluteFillObject]} />
        )}

        {/* Tooltip 卡片 */}
        <View style={[styles.tooltip, { top: tooltipPos.top, left: tooltipPos.left }]}>
          <Text style={styles.tooltipText}>{currentStep.text}</Text>
          <View style={styles.tooltipFooter}>
            {totalSteps > 1 && (
              <Text style={styles.stepIndicator}>
                {currentStepIndex + 1} / {totalSteps}
              </Text>
            )}
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissButtonText}>知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  spotlightBorder: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  tooltip: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
    marginBottom: 12,
  },
  tooltipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepIndicator: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: "auto",
  },
  dismissButtonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "600",
  },
});
