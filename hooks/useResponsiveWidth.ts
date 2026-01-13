import { useWindowDimensions } from "react-native";

interface UseResponsiveWidthReturn {
  width: number;
  isWideScreen: boolean;
  contentMaxWidth: number | undefined;
}

export function useResponsiveWidth(breakpoint: number = 600): UseResponsiveWidthReturn {
  const { width } = useWindowDimensions();

  // 寬螢幕時使用較窄的內容寬度
  const isWideScreen = width > breakpoint;
  const contentMaxWidth = isWideScreen ? 480 : undefined;

  return {
    width,
    isWideScreen,
    contentMaxWidth,
  };
}
